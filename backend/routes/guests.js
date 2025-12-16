import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/guests
// @desc    Get all guest users
// @access  Private (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const guests = await prisma.user.findMany({
      where: { role: 'guest' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/guests
// @desc    Create a new guest user
// @access  Private (Admin only)
router.post('/', [
  protect,
  adminOnly,
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim(),
  validate
], async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          ...(email ? [{ email: email.toLowerCase() }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username.toLowerCase() 
          ? 'Username already exists' 
          : 'Email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create guest user
    const guest = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email ? email.toLowerCase() : `${username.toLowerCase()}@guest.magic.com`,
        password: hashedPassword,
        name: name || username,
        role: 'guest',
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`Guest user created: ${guest.username} by admin ${req.user.username}`);
    
    res.status(201).json({
      message: 'Guest user created successfully',
      guest
    });
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/guests/:id
// @desc    Update guest user
// @access  Private (Admin only)
router.put('/:id', [
  protect,
  adminOnly,
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, name, isActive } = req.body;

    // Check if guest exists
    const existingGuest = await prisma.user.findFirst({
      where: { id, role: 'guest' }
    });

    if (!existingGuest) {
      return res.status(404).json({ message: 'Guest user not found' });
    }

    // Check for username/email conflicts (excluding current user)
    if (username || email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(username ? [{ username: username.toLowerCase() }] : []),
                ...(email ? [{ email: email.toLowerCase() }] : [])
              ]
            }
          ]
        }
      });

      if (conflictUser) {
        return res.status(400).json({ 
          message: conflictUser.username === username?.toLowerCase() 
            ? 'Username already exists' 
            : 'Email already exists' 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username.toLowerCase();
    if (email) updateData.email = email.toLowerCase();
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    // Update guest
    const updatedGuest = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`Guest user updated: ${updatedGuest.username} by admin ${req.user.username}`);
    
    res.json({
      message: 'Guest user updated successfully',
      guest: updatedGuest
    });
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/guests/:id
// @desc    Delete guest user
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if guest exists
    const existingGuest = await prisma.user.findFirst({
      where: { id, role: 'guest' }
    });

    if (!existingGuest) {
      return res.status(404).json({ message: 'Guest user not found' });
    }

    // Delete guest
    await prisma.user.delete({
      where: { id }
    });

    console.log(`Guest user deleted: ${existingGuest.username} by admin ${req.user.username}`);
    
    res.json({ message: 'Guest user deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/guests/:id/toggle-status
// @desc    Toggle guest user active status
// @access  Private (Admin only)
router.post('/:id/toggle-status', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if guest exists
    const existingGuest = await prisma.user.findFirst({
      where: { id, role: 'guest' }
    });

    if (!existingGuest) {
      return res.status(404).json({ message: 'Guest user not found' });
    }

    // Toggle status
    const updatedGuest = await prisma.user.update({
      where: { id },
      data: { isActive: !existingGuest.isActive },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });

    console.log(`Guest user ${updatedGuest.isActive ? 'activated' : 'deactivated'}: ${updatedGuest.username} by admin ${req.user.username}`);
    
    res.json({
      message: `Guest user ${updatedGuest.isActive ? 'activated' : 'deactivated'} successfully`,
      guest: updatedGuest
    });
  } catch (error) {
    console.error('Error toggling guest status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
