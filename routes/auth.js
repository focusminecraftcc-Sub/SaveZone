const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { redirectIfLoggedIn } = require('../middleware/auth');

// GET /register
router.get('/register', redirectIfLoggedIn, (req, res) => {
  res.sendFile('register.html', { root: './public' });
});

// POST /register
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, errors: errors.array().map(e => e.msg) });
  }

  const { username, name, email, password } = req.body;

  try {
    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.json({ success: false, errors: ['Username or email already taken'] });
    }

    const hashed = await bcrypt.hash(password, 12);
    db.prepare('INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)').run(username, name, email, hashed);
    res.json({ success: true, message: 'Account created successfully!' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, errors: ['Registration failed. Try again.'] });
  }
});

// GET /login
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.sendFile('login.html', { root: './public' });
});

// POST /login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.json({ success: false, message: 'All fields are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier);
  if (!user) {
    return res.json({ success: false, message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ success: false, message: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.name = user.name;
  res.json({ success: true, redirect: '/search' });
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// GET /forgot-password
router.get('/forgot-password', (req, res) => {
  res.sendFile('forgot-password.html', { root: './public' });
});

// POST /forgot-password (simulated)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  // Always return success to prevent email enumeration
  res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
});

module.exports = router;
