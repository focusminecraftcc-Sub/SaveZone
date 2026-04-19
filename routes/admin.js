const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// GET /admin/login
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.sendFile('admin-login.html', { root: './public' });
});

// POST /admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.adminName = 'Administrator';
    return res.json({ success: true, redirect: '/admin/dashboard' });
  }
  res.json({ success: false, message: 'Invalid admin credentials' });
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// GET /admin/dashboard
router.get('/dashboard', requireAdmin, (req, res) => {
  res.sendFile('admin-dashboard.html', { root: './public' });
});

// GET /admin/api/stats
router.get('/api/stats', requireAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalSearches = db.prepare('SELECT COUNT(*) as count FROM search_history').get().count;
  const todaySearches = db.prepare("SELECT COUNT(*) as count FROM search_history WHERE date(timestamp) = date('now')").get().count;
  const recentUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date("now", "-7 days")').get().count;

  res.json({ totalUsers, totalSearches, todaySearches, recentUsers });
});

// GET /admin/api/users
router.get('/api/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, name, email, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// PUT /admin/api/users/:id
router.put('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, name, email, password } = req.body;

  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) return res.json({ success: false, message: 'User not found' });

    if (password && password.trim()) {
      const hashed = await bcrypt.hash(password, 12);
      db.prepare('UPDATE users SET username=?, name=?, email=?, password=? WHERE id=?').run(username, name, email, hashed, id);
    } else {
      db.prepare('UPDATE users SET username=?, name=?, email=? WHERE id=?').run(username, name, email, id);
    }
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.json({ success: false, message: 'Update failed: ' + err.message });
  }
});

// DELETE /admin/api/users/:id
router.delete('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM search_history WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true, message: 'User deleted successfully' });
});

// GET /admin/api/activity
router.get('/api/activity', requireAdmin, (req, res) => {
  const activity = db.prepare(`
    SELECT
      sh.id,
      COALESCE(u.username, 'Deleted User') as username,
      COALESCE(u.email, 'N/A') as email,
      sh.search_query,
      sh.timestamp
    FROM search_history sh
    LEFT JOIN users u ON sh.user_id = u.id
    ORDER BY sh.timestamp DESC
    LIMIT 500
  `).all();
  res.json(activity);
});

// GET /admin/api/activity/export/pdf
router.get('/api/activity/export/pdf', requireAdmin, (req, res) => {
  const activity = db.prepare(`
    SELECT
      COALESCE(u.username, 'Deleted User') as username,
      COALESCE(u.email, 'N/A') as email,
      sh.search_query,
      sh.timestamp
    FROM search_history sh
    LEFT JOIN users u ON sh.user_id = u.id
    ORDER BY sh.timestamp DESC
  `).all();

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=savezone-activity.pdf');
  doc.pipe(res);

  // Title
  doc.fontSize(18).fillColor('#2563eb').text('SaveZone - User Activity Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  // Table header
  const cols = { username: 80, email: 180, query: 260, timestamp: 420 };
  const rowH = 20;
  const startX = 40;
  let y = doc.y;

  doc.fontSize(10).fillColor('#fff');
  doc.rect(startX, y, 730, rowH).fill('#2563eb');
  doc.fillColor('#fff')
    .text('Username', startX + 5, y + 5, { width: 90 })
    .text('Email', startX + 95, y + 5, { width: 155 })
    .text('Search Query', startX + 255, y + 5, { width: 230 })
    .text('Timestamp', startX + 490, y + 5, { width: 200 });

  y += rowH;
  doc.fillColor('#1f2937').fontSize(9);

  activity.forEach((row, i) => {
    if (y > 530) {
      doc.addPage({ size: 'A4', layout: 'landscape' });
      y = 40;
    }
    const bg = i % 2 === 0 ? '#f9fafb' : '#fff';
    doc.rect(startX, y, 730, rowH).fill(bg);
    doc.fillColor('#1f2937')
      .text(row.username, startX + 5, y + 5, { width: 85 })
      .text(row.email, startX + 95, y + 5, { width: 155 })
      .text(row.search_query, startX + 255, y + 5, { width: 225 })
      .text(new Date(row.timestamp).toLocaleString(), startX + 490, y + 5, { width: 200 });
    y += rowH;
  });

  doc.end();
});

// GET /admin/api/activity/export/excel
router.get('/api/activity/export/excel', requireAdmin, async (req, res) => {
  const activity = db.prepare(`
    SELECT
      COALESCE(u.username, 'Deleted User') as username,
      COALESCE(u.email, 'N/A') as email,
      sh.search_query,
      sh.timestamp
    FROM search_history sh
    LEFT JOIN users u ON sh.user_id = u.id
    ORDER BY sh.timestamp DESC
  `).all();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SaveZone';
  const sheet = workbook.addWorksheet('User Activity');

  sheet.columns = [
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Search Query', key: 'search_query', width: 40 },
    { header: 'Timestamp', key: 'timestamp', width: 25 },
  ];

  // Style header
  sheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  activity.forEach(row => {
    sheet.addRow({
      username: row.username,
      email: row.email,
      search_query: row.search_query,
      timestamp: new Date(row.timestamp).toLocaleString(),
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=savezone-activity.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
