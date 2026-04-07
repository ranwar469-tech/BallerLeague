import { body } from 'express-validator';

export const createPlayerValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('position').optional().trim(),
  body('number').optional().isInt({ min: 0 }).withMessage('number must be a positive integer'),
  body('nationality').optional().trim(),
  body('avatar').optional().trim()
];
