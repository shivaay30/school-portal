const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const flash = require('connect-flash');

const { initDb, getUserByEmail, getDashboardData, createUser, getNumberOfUsers } = require('./src/db');
const { comparePassword, hashPassword } = require('./src/utils/auth');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Session store directory (on Render use /tmp; project dir can be read-only)
const isRender = process.env.RENDER === 'true';
const sessionDir = isRender
  ? path.join(os.tmpdir(), 'school-portal', 'sessions')
  : path.join(__dirname, 'data', 'sessions');
fs.mkdirSync(sessionDir, { recursive: true });

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));

// Sessions (file store for production; no memory leak warning)
app.use(
  session({
    store: new FileStore({ path: sessionDir }),
    secret: process.env.SESSION_SECRET || 'school-portal-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
  })
);

// Flash messages
app.use(flash());

// Expose user + flash to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Store limited user info in session
    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role,
      student_id: user.student_id || null
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An unexpected error occurred. Please try again.');
    res.redirect('/login');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { name, email, password, confirmPassword, role, student_id } = req.body;

  const allowedRoles = ['student', 'teacher', 'parent'];

  if (!name || !email || !password || !confirmPassword || !role) {
    req.flash('error', 'Please fill in all required fields.');
    return res.redirect('/signup');
  }

  if (!allowedRoles.includes(role)) {
    req.flash('error', 'Invalid role selected.');
    return res.redirect('/signup');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }

  try {
    const passwordHash = await hashPassword(password);
    let studentIdVal = null;
    if (student_id && student_id.trim() !== '') {
      const parsed = parseInt(student_id, 10);
      if (!Number.isNaN(parsed)) {
        studentIdVal = parsed;
      }
    }

    await createUser({
      name,
      email,
      passwordHash,
      role,
      student_id: studentIdVal
    });

    req.flash('success', 'Account created successfully. Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err);
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      req.flash('error', 'An account with this email already exists.');
    } else {
      req.flash('error', 'Unable to create account. Please try again.');
    }
    res.redirect('/signup');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const dashboardData = await getDashboardData(req.session.user);
    res.render('dashboard', {
      user: req.session.user,
      data: dashboardData
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Unable to load dashboard.');
    res.redirect('/login');
  }
});

// Auto-seed when no users (so admin works on Render after deploy)
async function start() {
  try {
    const count = await getNumberOfUsers();
    if (count === 0) {
      console.log('No users found — seeding database...');
      await seed();
    }
  } catch (err) {
    console.error('Startup seed check failed:', err);
  }
  app.listen(PORT, () => {
    console.log(`Rogers School portal running on http://localhost:${PORT}`);
  });
}

start();

