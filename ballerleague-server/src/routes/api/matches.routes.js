import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAnyRole } from '../../middleware/auth.js';
import { Match } from '../../models/match.model.js';
import { Team } from '../../models/team.model.js';
import { Season } from '../../models/season.model.js';
import { SeasonTeam } from '../../models/season-team.model.js';
import { Player } from '../../models/player.model.js';
import { Event } from '../../models/event.model.js';
import {
  createMatchCalendarEventValidator,
  createManualMatchValidator,
  matchCalendarEventIdParamValidator,
  matchIdParamValidator,
  publishMatchValidator,
  publishScheduleValidator,
  recordGoalEventValidator,
  recordMatchResultValidator,
  standingsQueryValidator,
  topScorersQueryValidator,
  updateMatchCalendarGoogleIdValidator,
  updateGoalAssistValidator,
  updateMatchScheduleValidator,
  updateMatchStatusValidator
} from '../../validators/match.validators.js';

const router = Router();

function buildTeamNameMap(teams) {
  return new Map(teams.map((team) => [team.id, team.name]));
}

function toStandingsRows(matches, teamIds) {
  const table = new Map();

  for (const teamId of teamIds) {
    table.set(teamId, {
      team_id: teamId,
      mp: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    });
  }

  for (const match of matches) {
    if (match.status !== 'completed') {
      continue;
    }

    const home = table.get(match.home_team_id) || {
      team_id: match.home_team_id,
      mp: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    };
    const away = table.get(match.away_team_id) || {
      team_id: match.away_team_id,
      mp: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    };

    const homeScore = Number(match.home_score ?? 0);
    const awayScore = Number(match.away_score ?? 0);

    home.mp += 1;
    away.mp += 1;
    home.gf += homeScore;
    home.ga += awayScore;
    away.gf += awayScore;
    away.ga += homeScore;

    if (homeScore > awayScore) {
      home.w += 1;
      away.l += 1;
      home.pts += 3;
    } else if (homeScore < awayScore) {
      away.w += 1;
      home.l += 1;
      away.pts += 3;
    } else {
      home.d += 1;
      away.d += 1;
      home.pts += 1;
      away.pts += 1;
    }

    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    table.set(home.team_id, home);
    table.set(away.team_id, away);
  }

  return [...table.values()];
}

function computePlayerStatsFromMatches(matches) {
  const statsByPlayer = new Map();

  for (const match of matches) {
    if (match.status !== 'completed') {
      continue;
    }

    const events = Array.isArray(match.goal_events) ? match.goal_events : [];
    for (const event of events) {
      const scorerId = Number(event.scorer_player_id);
      const assistId = event.assist_player_id ? Number(event.assist_player_id) : null;

      if (!statsByPlayer.has(scorerId)) {
        statsByPlayer.set(scorerId, { goals: 0, assists: 0, matchIds: new Set() });
      }

      const scorer = statsByPlayer.get(scorerId);
      scorer.goals += 1;
      scorer.matchIds.add(match.id);

      if (assistId) {
        if (!statsByPlayer.has(assistId)) {
          statsByPlayer.set(assistId, { goals: 0, assists: 0, matchIds: new Set() });
        }

        const assister = statsByPlayer.get(assistId);
        assister.assists += 1;
        assister.matchIds.add(match.id);
      }
    }
  }

  return statsByPlayer;
}

async function recomputeAndPersistPlayerStatsForSeason(seasonId) {
  const completedMatches = await Match.find({ season_id: seasonId, status: 'completed' }, { _id: 0 }).lean();
  const statsByPlayer = computePlayerStatsFromMatches(completedMatches);
  const playerIds = [...statsByPlayer.keys()];

  await Player.updateMany({ season_id: seasonId }, { apps: 0, goals: 0, assists: 0 });

  if (playerIds.length === 0) {
    return;
  }

  const ops = playerIds.map((playerId) => {
    const stats = statsByPlayer.get(playerId);
    return {
      updateOne: {
        filter: { id: playerId, season_id: seasonId },
        update: {
          apps: stats.matchIds.size,
          goals: stats.goals,
          assists: stats.assists
        }
      }
    };
  });

  if (ops.length > 0) {
    await Player.bulkWrite(ops, { ordered: false });
  }
}

function mapEventDocument(eventDoc) {
  return {
    id: eventDoc.id,
    title: eventDoc.title,
    description: eventDoc.description,
    location: eventDoc.location,
    start: eventDoc.start,
    end: eventDoc.end,
    allDay: eventDoc.allDay,
    googleCalendarEventId: eventDoc.googleCalendarEventId
  };
}

router.get('/calendar', async (req, res) => {
  try {
    const events = await Event.find({}, { _id: 0 }).sort({ 'start.dateTime': 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load match calendar events', error: error.message });
  }
});

router.get('/calendar/:id', matchCalendarEventIdParamValidator, validateRequest, async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.params.id }, { _id: 0 });

    if (!event) {
      return res.status(404).json({ message: 'Match calendar event not found' });
    }

    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load match calendar event', error: error.message });
  }
});

router.post(
  '/calendar',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  createMatchCalendarEventValidator,
  validateRequest,
  async (req, res) => {
    try {
      const event = await Event.create({
        id: req.body.id,
        title: req.body.title,
        description: req.body.description ?? '',
        location: req.body.location ?? '',
        start: {
          dateTime: req.body.start.dateTime,
          timeZone: req.body.start.timeZone
        },
        end: {
          dateTime: req.body.end.dateTime,
          timeZone: req.body.end.timeZone
        },
        allDay: req.body.allDay ?? false,
        googleCalendarEventId: req.body.googleCalendarEventId ?? null
      });

      return res.status(201).json(mapEventDocument(event));
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'A match calendar event with this id already exists' });
      }

      return res.status(500).json({ message: 'Failed to create match calendar event', error: error.message });
    }
  }
);

router.patch(
  '/calendar/:id/google-id',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateMatchCalendarGoogleIdValidator,
  validateRequest,
  async (req, res) => {
    try {
      const updatedEvent = await Event.findOneAndUpdate(
        { id: req.params.id },
        { googleCalendarEventId: req.body.googleCalendarEventId ?? null },
        { new: true, projection: { _id: 0 } }
      );

      if (!updatedEvent) {
        return res.status(404).json({ message: 'Match calendar event not found' });
      }

      return res.json(updatedEvent);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update match calendar Google id', error: error.message });
    }
  }
);

router.get('/standings', standingsQueryValidator, validateRequest, async (req, res) => {
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const matchFilter = seasonId ? { season_id: seasonId } : {};
  const matches = await Match.find(matchFilter, { _id: 0 }).lean();

  let teamIds = [];
  if (seasonId) {
    const seasonTeams = await SeasonTeam.find({ season_id: seasonId }, { _id: 0, team_id: 1 }).lean();
    teamIds = seasonTeams.map((row) => Number(row.team_id));
  }

  if (teamIds.length === 0) {
    teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  }

  const rows = toStandingsRows(matches, teamIds);
  const teams = await Team.find({ id: { $in: teamIds } }, { _id: 0, id: 1, name: 1 }).lean();
  const teamNameMap = buildTeamNameMap(teams);

  const sorted = rows
    .map((row) => ({
      ...row,
      team_name: teamNameMap.get(row.team_id) || `Team ${row.team_id}`
    }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team_name.localeCompare(b.team_name);
    })
    .map((row, index) => ({ ...row, pos: index + 1 }));

  return res.json(sorted);
});

router.get('/player-stats', topScorersQueryValidator, validateRequest, async (req, res) => {
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const matchFilter = seasonId ? { season_id: seasonId, status: 'completed' } : { status: 'completed' };
  const matches = await Match.find(matchFilter, { _id: 0 }).lean();
  const statsByPlayer = computePlayerStatsFromMatches(matches);
  const playerIds = [...statsByPlayer.keys()];

  if (playerIds.length === 0) {
    return res.json([]);
  }

  const players = await Player.find({ id: { $in: playerIds } }, { _id: 0 }).lean();
  const teamIds = [...new Set(players.map((player) => player.team_id).filter(Boolean))];
  const teams = await Team.find({ id: { $in: teamIds } }, { _id: 0, id: 1, name: 1 }).lean();
  const teamNameMap = buildTeamNameMap(teams);

  const rows = players
    .map((player) => {
      const stats = statsByPlayer.get(player.id) || { goals: 0, assists: 0, matchIds: new Set() };
      return {
        player_id: player.id,
        name: player.name,
        team_id: player.team_id,
        team_name: player.team_id ? teamNameMap.get(player.team_id) || `Team ${player.team_id}` : 'Unknown Team',
        position: player.position,
        apps: stats.matchIds.size,
        goals: stats.goals,
        assists: stats.assists,
        rating: player.rating || 0
      };
    })
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return res.json(rows);
});

router.get('/top-scorers', topScorersQueryValidator, validateRequest, async (req, res) => {
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const matchFilter = seasonId ? { season_id: seasonId, status: 'completed' } : { status: 'completed' };
  const matches = await Match.find(matchFilter, { _id: 0 }).lean();
  const statsByPlayer = computePlayerStatsFromMatches(matches);
  const playerIds = [...statsByPlayer.keys()];

  if (playerIds.length === 0) {
    return res.json([]);
  }

  const players = await Player.find({ id: { $in: playerIds } }, { _id: 0, id: 1, name: 1, team_id: 1 }).lean();
  const teamIds = [...new Set(players.map((player) => player.team_id).filter(Boolean))];
  const teams = await Team.find({ id: { $in: teamIds } }, { _id: 0, id: 1, name: 1 }).lean();
  const teamNameMap = buildTeamNameMap(teams);

  const rows = players
    .map((player) => {
      const stats = statsByPlayer.get(player.id) || { goals: 0, assists: 0, matchIds: new Set() };
      return {
        player_id: player.id,
        name: player.name,
        team_name: player.team_id ? teamNameMap.get(player.team_id) || `Team ${player.team_id}` : 'Unknown Team',
        goals: stats.goals
      };
    })
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return res.json(rows);
});

async function enrichMatches(matchDocs) {
  const matches = matchDocs.map((item) => (typeof item.toObject === 'function' ? item.toObject() : item));
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const teams = await Team.find({ id: { $in: teamIds } }, { _id: 0, id: 1, name: 1 }).lean();
  const teamMap = new Map(teams.map((team) => [team.id, team.name]));

  return matches.map((match) => ({
    ...match,
    home_team_name: teamMap.get(match.home_team_id) || `Team ${match.home_team_id}`,
    away_team_name: teamMap.get(match.away_team_id) || `Team ${match.away_team_id}`
  }));
}

router.get('/admin/all', requireAuth, requireAnyRole('league_admin', 'system_admin'), async (req, res) => {
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const filter = seasonId ? { season_id: seasonId } : {};
  const matches = await Match.find(filter, { _id: 0 }).sort({ kickoff_at: 1 });
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get('/upcoming', async (req, res) => {
  const now = new Date();
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const filter = {
    published: true,
    status: { $in: ['scheduled', 'postponed'] },
    kickoff_at: { $gte: now }
  };

  if (seasonId) {
    filter.season_id = seasonId;
  }

  const matches = await Match.find(filter, { _id: 0 }).sort({ kickoff_at: 1 });
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get('/past', async (req, res) => {
  const now = new Date();
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const filter = {
    published: true,
    $or: [{ kickoff_at: { $lt: now } }, { status: { $in: ['completed', 'cancelled'] } }]
  };

  if (seasonId) {
    filter.season_id = seasonId;
  }

  const matches = await Match.find(filter, { _id: 0 }).sort({ kickoff_at: -1 });
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get('/:id', matchIdParamValidator, validateRequest, async (req, res) => {
  const matchId = Number(req.params.id);
  const match = await Match.findOne({ id: matchId }, { _id: 0 });

  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  const [enriched] = await enrichMatches([match]);
  return res.json(enriched);
});

router.post(
  '/manual',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  createManualMatchValidator,
  validateRequest,
  async (req, res) => {
    const seasonId = Number(req.body.season_id);
    const homeTeamId = Number(req.body.home_team_id);
    const awayTeamId = Number(req.body.away_team_id);

    const [season, homeTeam, awayTeam] = await Promise.all([
      Season.findOne({ id: seasonId }).select('id'),
      Team.findOne({ id: homeTeamId }).select('id'),
      Team.findOne({ id: awayTeamId }).select('id')
    ]);

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    if (!homeTeam || !awayTeam) {
      return res.status(404).json({ message: 'Home or away team not found' });
    }

    const last = await Match.findOne().sort({ id: -1 }).select('id');
    const nextMatchId = last ? Number(last.id) + 1 : 1;

    const created = await Match.create({
      id: nextMatchId,
      season_id: seasonId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      venue: req.body.venue ?? '',
      kickoff_at: new Date(req.body.kickoff_at),
      published: req.body.published ?? false,
      created_by: req.auth?.sub || null
    });

    const [enriched] = await enrichMatches([created]);
    return res.status(201).json(enriched);
  }
);

router.patch(
  '/:id/result',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  recordMatchResultValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      {
        home_score: Number(req.body.home_score),
        away_score: Number(req.body.away_score),
        status: req.body.status || 'completed',
        result_recorded_at: new Date()
      },
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    await recomputeAndPersistPlayerStatsForSeason(updated.season_id);
    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.patch(
  '/:id/score',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  recordMatchResultValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      {
        home_score: Number(req.body.home_score),
        away_score: Number(req.body.away_score),
        result_recorded_at: new Date()
      },
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.post(
  '/:id/goals',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  recordGoalEventValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const match = await Match.findOne({ id: matchId });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const teamId = Number(req.body.team_id);
    if (![match.home_team_id, match.away_team_id].includes(teamId)) {
      return res.status(400).json({ message: 'team_id must be one of the two match teams' });
    }

    const scorerPlayerId = Number(req.body.scorer_player_id);
    const assistPlayerId = req.body.assist_player_id ? Number(req.body.assist_player_id) : null;

    const [scorerPlayer, assistPlayer] = await Promise.all([
      Player.findOne({ id: scorerPlayerId }).select('id team_id'),
      assistPlayerId ? Player.findOne({ id: assistPlayerId }).select('id team_id') : null
    ]);

    if (!scorerPlayer) {
      return res.status(404).json({ message: 'Scorer player not found' });
    }

    if (scorerPlayer.team_id !== teamId) {
      return res.status(400).json({ message: 'Scorer player must belong to the scoring team' });
    }

    if (assistPlayerId && (!assistPlayer || assistPlayer.team_id !== teamId)) {
      return res.status(400).json({ message: 'Assist player must exist and belong to the scoring team' });
    }

    const nextGoalId = (match.goal_events || []).reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
    const nextGoalEvent = {
      id: nextGoalId,
      minute: Number(req.body.minute),
      team_id: teamId,
      scorer_player_id: scorerPlayerId,
      assist_player_id: assistPlayerId
    };

    match.goal_events = [...(match.goal_events || []), nextGoalEvent];
    if (teamId === match.home_team_id) {
      match.home_score = Number(match.home_score || 0) + 1;
    } else {
      match.away_score = Number(match.away_score || 0) + 1;
    }
    match.status = 'completed';
    match.result_recorded_at = new Date();

    await match.save();
    await recomputeAndPersistPlayerStatsForSeason(match.season_id);

    const [enriched] = await enrichMatches([match]);
    return res.status(201).json({
      ...enriched,
      goal_event: nextGoalEvent
    });
  }
);

router.patch(
  '/:id/goals/:goalId/assist',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateGoalAssistValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const goalId = Number(req.params.goalId);
    const assistPlayerId = req.body.assist_player_id ? Number(req.body.assist_player_id) : null;
    const match = await Match.findOne({ id: matchId });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const index = (match.goal_events || []).findIndex((event) => Number(event.id) === goalId);
    if (index < 0) {
      return res.status(404).json({ message: 'Goal event not found' });
    }

    const goalEvent = match.goal_events[index];
    if (assistPlayerId) {
      const assistPlayer = await Player.findOne({ id: assistPlayerId }).select('id team_id');
      if (!assistPlayer || assistPlayer.team_id !== goalEvent.team_id) {
        return res.status(400).json({ message: 'Assist player must exist and belong to the scoring team' });
      }
    }

    goalEvent.assist_player_id = assistPlayerId;
    match.goal_events[index] = goalEvent;
    await match.save();
    await recomputeAndPersistPlayerStatsForSeason(match.season_id);

    const [enriched] = await enrichMatches([match]);
    return res.json(enriched);
  }
);

router.patch(
  '/:id/schedule',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateMatchScheduleValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updates = {};

    if (req.body.kickoff_at) {
      updates.kickoff_at = new Date(req.body.kickoff_at);
    }

    if (typeof req.body.venue === 'string') {
      updates.venue = req.body.venue;
    }

    if (typeof req.body.season_id !== 'undefined') {
      const seasonId = Number(req.body.season_id);
      const season = await Season.findOne({ id: seasonId }).select('id');
      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }
      updates.season_id = seasonId;
    }

    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      updates,
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.patch(
  '/:id/status',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateMatchStatusValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      {
        status: req.body.status,
        status_note: req.body.status_note ?? ''
      },
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.patch(
  '/:id/publish',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  publishMatchValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      { published: req.body.published },
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.post(
  '/publish',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  publishScheduleValidator,
  validateRequest,
  async (req, res) => {
    const seasonId = req.body.season_id ? Number(req.body.season_id) : null;
    const published = typeof req.body.published === 'boolean' ? req.body.published : true;

    const filter = seasonId ? { season_id: seasonId } : {};
    const result = await Match.updateMany(filter, { published });

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      published,
      season_id: seasonId
    });
  }
);

export default router;
