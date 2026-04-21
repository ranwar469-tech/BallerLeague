import { Router } from 'express';
import { Event } from '../../../models/event.model.js';
import { requireAuth } from '../../../middleware/auth.js';
import { validateRequest } from '../../../middleware/validate.js';
import {
  createMatchCalendarEventValidator,
  matchCalendarEventIdParamValidator,
  updateMatchCalendarGoogleIdValidator
} from '../../../validators/match.validators.js';
import { mapEventDocument } from './shared.js';

const router = Router();

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

router.post('/calendar', requireAuth, createMatchCalendarEventValidator, validateRequest, async (req, res) => {
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
});

router.patch(
  '/calendar/:id/google-id',
  requireAuth,
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

export default router;
