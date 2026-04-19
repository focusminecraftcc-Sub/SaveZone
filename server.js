const express = require('express');
const session = require('express-session');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize DB
require('./db/database');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: 'savezone_secret_key_2024',
  resave: false,
  saveUninitialized: false
}));

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/search'));
app.use('/', require('./routes/chatbot'));
app.use('/admin', require('./routes/admin'));

// Session info endpoint
app.get('/api/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ id: req.session.userId, username: req.session.username, name: req.session.name });
  }
  res.status(401).json({ error: 'Not logged in' });
});

// Home route
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/search');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`SaveZone running on http://localhost:${PORT}`);
  });
}

module.exports = app;
