import express from 'express';
import { smcSchedulesDB, startupsDB } from '../utils/db.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/smc
// @desc    Get all SMC schedules
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { date, status } = req.query;
    let schedules = smcSchedulesDB.findAll();

    if (date) {
      schedules = schedules.filter(s => s.date === date);
    }
    if (status) {
      schedules = schedules.filter(s => s.status === status);
    }

    // Populate startup data
    schedules = schedules.map(schedule => {
      const startup = startupsDB.findById(schedule.startupId);
      return {
        ...schedule,
        startup: startup || null
      };
    });

    schedules.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const timeOrder = { '10 AM': 1, '11 AM': 2, '2 PM': 3, '3 PM': 4 };
      return (timeOrder[a.timeSlot] || 0) - (timeOrder[b.timeSlot] || 0);
    });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/smc
// @desc    Create SMC schedule
// @access  Private (Admin only)
router.post('/', [protect, adminOnly], async (req, res) => {
  try {
    const { startupId, date, timeSlot } = req.body;

    // Check if slot is already booked
    const existing = smcSchedulesDB.findOne({ date, timeSlot, status: 'Scheduled' });
    if (existing) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    const schedule = smcSchedulesDB.create({
      startupId,
      date,
      timeSlot,
      status: 'Scheduled',
      panelistName: '',
      feedback: ''
    });

    // Populate startup data
    const startup = startupsDB.findById(startupId);
    schedule.startup = startup;

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/smc/:id/complete
// @desc    Mark SMC as completed
// @access  Private (Admin only)
router.put('/:id/complete', [protect, adminOnly], async (req, res) => {
  try {
    const { panelistName, feedback } = req.body;

    const schedule = smcSchedulesDB.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Update schedule
    const updatedSchedule = smcSchedulesDB.update(req.params.id, {
      status: 'Completed',
      panelistName,
      feedback,
      completedAt: new Date().toISOString()
    });

    // Update startup pitch history and stage
    const startup = startupsDB.findById(schedule.startupId);
    if (startup) {
      startup.pitchHistory = startup.pitchHistory || [];
      startup.pitchHistory.push({
        stage: startup.stage,
        date: schedule.date,
        time: schedule.timeSlot,
        panelistName,
        feedback
      });

      // Auto-progress stage
      if (startup.stage === 'S0') startup.stage = 'S1';
      else if (startup.stage === 'S1') startup.stage = 'S2';
      else if (startup.stage === 'S2') startup.stage = 'S3';

      startupsDB.update(startup.id, startup);
    }

    // Populate startup data
    updatedSchedule.startup = startupsDB.findById(schedule.startupId);

    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/smc/:id
// @desc    Delete SMC schedule
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const deleted = smcSchedulesDB.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
