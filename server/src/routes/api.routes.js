import { Router } from 'express';
import { validateRequest } from '../middleware/validate.js';
import { createLeagueValidator } from '../validators/league.validators.js';
import { createSeasonValidator, assignTeamToSeasonValidator } from '../validators/season.validators.js';
import {
  createTeamValidator,
  assignPlayerToTeamValidator,
  listTeamPlayersValidator
} from '../validators/team.validators.js';
import { createPlayerValidator } from '../validators/player.validators.js';
import { store, nextId } from '../data/store.js';

const router = Router();

router.get('/leagues', (req, res) => {
  res.json(store.leagues);
});

router.post('/leagues', createLeagueValidator, validateRequest, (req, res) => {
  const league = {
    id: nextId('leagues'),
    name: req.body.name,
    country: req.body.country ?? '',
    logo: req.body.logo ?? ''
  };

  store.leagues.push(league);
  res.status(201).json(league);
});

router.get('/seasons', (req, res) => {
  const seasons = store.seasons.map((season) => {
    const league = store.leagues.find((l) => l.id === season.league_id);
    return {
      ...season,
      league_name: league?.name ?? 'Unknown League'
    };
  });

  res.json(seasons);
});

router.post('/seasons', createSeasonValidator, validateRequest, (req, res) => {
  const season = {
    id: nextId('seasons'),
    league_id: Number(req.body.league_id),
    name: req.body.name,
    start_date: req.body.start_date ?? '',
    end_date: req.body.end_date ?? ''
  };

  store.seasons.push(season);
  res.status(201).json(season);
});

router.get('/teams', (req, res) => {
  res.json(store.teams);
});

router.post('/teams', createTeamValidator, validateRequest, (req, res) => {
  const team = {
    id: nextId('teams'),
    name: req.body.name,
    stadium: req.body.stadium ?? '',
    city: req.body.city ?? '',
    logo: req.body.logo ?? ''
  };

  store.teams.push(team);
  res.status(201).json(team);
});

router.get('/players', (req, res) => {
  res.json(store.players);
});

router.post('/players', createPlayerValidator, validateRequest, (req, res) => {
  const player = {
    id: nextId('players'),
    name: req.body.name,
    position: req.body.position ?? '',
    number: Number(req.body.number ?? 0),
    nationality: req.body.nationality ?? '',
    avatar: req.body.avatar ?? ''
  };

  store.players.push(player);
  res.status(201).json(player);
});

router.post('/seasons/:id/teams', assignTeamToSeasonValidator, validateRequest, (req, res) => {
  const seasonId = Number(req.params.id);
  const teamId = Number(req.body.team_id);

  const exists = store.season_teams.some((item) => item.season_id === seasonId && item.team_id === teamId);
  if (exists) {
    return res.status(409).json({ message: 'Team already assigned to this season' });
  }

  store.season_teams.push({ season_id: seasonId, team_id: teamId });
  return res.status(201).json({ success: true });
});

router.get('/seasons/:id/teams', (req, res) => {
  const seasonId = Number(req.params.id);
  const teamIds = store.season_teams.filter((item) => item.season_id === seasonId).map((item) => item.team_id);
  const teams = store.teams.filter((team) => teamIds.includes(team.id));

  res.json(teams);
});

router.post('/teams/:id/players', assignPlayerToTeamValidator, validateRequest, (req, res) => {
  const entry = {
    id: nextId('team_players'),
    team_id: Number(req.params.id),
    player_id: Number(req.body.player_id),
    season_id: Number(req.body.season_id)
  };

  store.team_players.push(entry);
  res.status(201).json(entry);
});

router.get('/teams/:id/players', listTeamPlayersValidator, validateRequest, (req, res) => {
  const teamId = Number(req.params.id);
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;

  const roster = store.team_players
    .filter((entry) => entry.team_id === teamId && (seasonId ? entry.season_id === seasonId : true))
    .map((entry) => {
      const player = store.players.find((p) => p.id === entry.player_id);
      return {
        ...player,
        season_id: entry.season_id
      };
    })
    .filter(Boolean);

  res.json(roster);
});

export default router;
