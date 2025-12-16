import express from 'express';
import { settingsDB } from '../utils/db.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const settings = settingsDB.read();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/settings/:key
// @desc    Get setting by key
// @access  Private
router.get('/:key', protect, async (req, res) => {
  try {
    const settings = settingsDB.read();
    const value = settings[req.params.key];
    
    if (value === undefined) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json({ key: req.params.key, value });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/:key
// @desc    Update setting
// @access  Private (Admin only)
router.put('/:key', [protect, adminOnly], async (req, res) => {
  try {
    const { value, description } = req.body;

    const settings = settingsDB.read();
    settings[req.params.key] = value;
    settingsDB.write(settings);

    res.json({ key: req.params.key, value, description });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
