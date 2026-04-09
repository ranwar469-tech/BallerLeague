import { body, param, query } from 'express-validator';

export const matchIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('match id must be a positive integer')
];

export const createManualMatchValidator = [
  body('season_id').isInt({ min: 1 }).withMessage('season_id must be a positive integer'),
  body('home_team_id').isInt({ min: 1 }).withMessage('home_team_id must be a positive integer'),
  body('away_team_id').isInt({ min: 1 }).withMessage('away_team_id must be a positive integer'),
  body('away_team_id')
    .custom((value, { req }) => Number(value) !== Number(req.body.home_team_id))
    .withMessage('home_team_id and away_team_id must be different'),
  body('kickoff_at').isISO8601().withMessage('kickoff_at must be a valid ISO date-time'),
  body('venue').optional().trim(),
  body('published').optional().isBoolean().withMessage('published must be a boolean')
];

export const updateMatchScheduleValidator = [
  ...matchIdParamValidator,
  body('kickoff_at').optional().isISO8601().withMessage('kickoff_at must be a valid ISO date-time'),
  body('venue').optional().trim(),
  body('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer')
];

export const updateMatchStatusValidator = [
  ...matchIdParamValidator,
  body('status')
    .isIn(['scheduled', 'postponed', 'cancelled', 'completed'])
    .withMessage('status must be scheduled, postponed, cancelled, or completed'),
  body('status_note').optional().trim()
];

export const publishMatchValidator = [
  ...matchIdParamValidator,
  body('published').isBoolean().withMessage('published must be a boolean')
];

export const publishScheduleValidator = [
  body('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer'),
  body('published').optional().isBoolean().withMessage('published must be a boolean')
];

export const recordMatchResultValidator = [
  ...matchIdParamValidator,
  body('home_score').isInt({ min: 0 }).withMessage('home_score must be a non-negative integer'),
  body('away_score').isInt({ min: 0 }).withMessage('away_score must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['scheduled', 'postponed', 'cancelled', 'completed'])
    .withMessage('status must be scheduled, postponed, cancelled, or completed')
];

export const recordGoalEventValidator = [
  ...matchIdParamValidator,
  body('minute').isInt({ min: 0, max: 130 }).withMessage('minute must be between 0 and 130'),
  body('team_id').isInt({ min: 1 }).withMessage('team_id must be a positive integer'),
  body('scorer_player_id').isInt({ min: 1 }).withMessage('scorer_player_id must be a positive integer'),
  body('assist_player_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('assist_player_id must be a positive integer')
];

export const updateGoalAssistValidator = [
  ...matchIdParamValidator,
  param('goalId').isInt({ min: 1 }).withMessage('goalId must be a positive integer'),
  body('assist_player_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('assist_player_id must be a positive integer')
];

export const standingsQueryValidator = [
  query('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer')
];

export const topScorersQueryValidator = [
  query('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200')
];

export const matchCalendarEventIdParamValidator = [
  param('id').trim().notEmpty().withMessage('calendar event id param is required')
];

export const createMatchCalendarEventValidator = [
  body('id').trim().notEmpty().withMessage('id is required'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('location').optional().isString().withMessage('location must be a string'),
  body('start.dateTime').trim().notEmpty().withMessage('start.dateTime is required'),
  body('start.timeZone').trim().notEmpty().withMessage('start.timeZone is required'),
  body('end.dateTime').trim().notEmpty().withMessage('end.dateTime is required'),
  body('end.timeZone').trim().notEmpty().withMessage('end.timeZone is required'),
  body('allDay').optional().isBoolean().withMessage('allDay must be boolean'),
  body('googleCalendarEventId').optional({ nullable: true }).isString().withMessage('googleCalendarEventId must be a string or null')
];

export const updateMatchCalendarGoogleIdValidator = [
  ...matchCalendarEventIdParamValidator,
  body('googleCalendarEventId')
    .optional({ nullable: true })
    .isString()
    .withMessage('googleCalendarEventId must be a string or null')
];
