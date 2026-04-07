import { body, param, query } from 'express-validator';

export const createTeamValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('stadium').optional().trim(),
  body('city').optional().trim(),
  body('logo').optional().trim()
];

export const assignPlayerToTeamValidator = [
  param('id').isInt({ min: 1 }).withMessage('team id must be a positive integer'),
  body('player_id').isInt({ min: 1 }).withMessage('player_id must be a positive integer'),
  body('season_id').isInt({ min: 1 }).withMessage('season_id must be a positive integer')
];

export const listTeamPlayersValidator = [
  param('id').isInt({ min: 1 }).withMessage('team id must be a positive integer'),
  query('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer')
];
