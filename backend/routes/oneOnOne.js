import express from 'express';
import { oneOnOneSessionsDB, startupsDB } from '../utils/db.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/one-on-one
// @desc    Get all one-on-one sessions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let sessions = oneOnOneSessionsDB.findAll();

    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }

    // Populate startup data
    sessions = sessions.map(session => {
      const startup = startupsDB.findById(session.startupId);
      return {
        ...session,
        startup: startup || null
      };
    });

    sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/one-on-one
// @desc    Create one-on-one session
// @access  Private (Admin only)
router.post('/', [protect, adminOnly], async (req, res) => {
  try {
    const session = oneOnOneSessionsDB.create({
      ...req.body,
      startupId: req.body.startup || req.body.startupId,
      status: 'Scheduled',
      feedback: '',
      progress: ''
    });

    // Update startup stage to One-on-One
    startupsDB.update(session.startupId, { stage: 'One-on-One' });

    // Populate startup data
    session.startup = startupsDB.findById(session.startupId);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/one-on-one/:id/complete
// @desc    Mark session as completed
// @access  Private (Admin only)
router.put('/:id/complete', [protect, adminOnly], async (req, res) => {
  try {
    const { feedback, progress } = req.body;

    const session = oneOnOneSessionsDB.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update session
    const updatedSession = oneOnOneSessionsDB.update(req.params.id, {
      status: 'Completed',
      feedback,
      progress,
      completedAt: new Date().toISOString()
    });

    // Update startup one-on-one history
    const startup = startupsDB.findById(session.startupId);
    if (startup) {
      startup.oneOnOneHistory = startup.oneOnOneHistory || [];
      startup.oneOnOneHistory.push({
        date: session.date,
        time: session.time,
        mentorName: session.mentorName,
        feedback,
        progress
      });
      startupsDB.update(startup.id, startup);
    }

    // Populate startup data
    updatedSession.startup = startupsDB.findById(session.startupId);

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/one-on-one/:id
// @desc    Delete session
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const deleted = oneOnOneSessionsDB.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
