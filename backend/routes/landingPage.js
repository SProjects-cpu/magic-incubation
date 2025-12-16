import express from 'express';
import { landingPageDB } from '../utils/db.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/landing-page
// @desc    Get landing page content
// @access  Public
router.get('/', async (req, res) => {
  try {
    let landingPage = landingPageDB.read();
    
    if (!landingPage || Object.keys(landingPage).length === 0) {
      landingPage = {
        hero: {
          title: 'Welcome to MAGIC',
          subtitle: 'Empowering Startups in Marathwada',
          ctaText: 'Get Started'
        },
        features: [],
        stats: [],
        testimonials: [],
        contact: {}
      };
    }

    res.json(landingPage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/landing-page
// @desc    Update landing page content
// @access  Private (Admin only)
router.put('/', [protect, adminOnly], async (req, res) => {
  try {
    landingPageDB.write(req.body);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
