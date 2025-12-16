import express from 'express';
import { startupsDB } from '../utils/db.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/achievements/:startupId
// @desc    Add achievement to startup
// @access  Private (Admin only)
router.post('/:startupId', [protect, adminOnly], async (req, res) => {
  try {
    const startup = startupsDB.findById(req.params.startupId);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    startup.achievements = startup.achievements || [];
    startup.achievements.push(req.body);
    
    const updated = startupsDB.update(req.params.startupId, startup);
    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/achievements/:startupId/:achievementId
// @desc    Remove achievement from startup
// @access  Private (Admin only)
router.delete('/:startupId/:achievementId', [protect, adminOnly], async (req, res) => {
  try {
    const startup = startupsDB.findById(req.params.startupId);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    startup.achievements = (startup.achievements || []).filter(
      a => a.id !== req.params.achievementId
    );
    
    const updated = startupsDB.update(req.params.startupId, startup);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
