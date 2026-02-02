const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

// On Render the project filesystem is read-only; use /tmp (writable but ephemeral)
const isRender = process.env.RENDER === 'true';
const dataBaseDir = isRender
  ? path.join(os.tmpdir(), 'school-portal')
  : path.join(__dirname, 'data');
const DB_PATH = path.join(dataBaseDir, 'school.db');

// Ensure data directory exists
if (!fs.existsSync(dataBaseDir)) {
  fs.mkdirSync(dataBaseDir, { recursive: true });
}

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

function initDb() {
  const db = getDb();

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'parent', 'admin')),
        student_id INTEGER
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        term TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students (id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late')),
        FOREIGN KEY (student_id) REFERENCES students (id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS homework (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class TEXT NOT NULL,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);
  });

  db.close();
}

function getUserByEmail(email) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function createUser({ name, email, passwordHash, role, student_id }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, student_id || null],
      function (err) {
        db.close();
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function getDashboardData(user) {
  const db = getDb();

  return new Promise((resolve, reject) => {
    if (user.role === 'student') {
      const data = {};

      db.serialize(() => {
        db.get('SELECT * FROM students WHERE id = ?', [user.student_id], (err, student) => {
          if (err) {
            db.close();
            return reject(err);
          }
          data.student = student;
        });

        db.all(
          'SELECT subject, score, max_score, term FROM results WHERE student_id = ?',
          [user.student_id],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.results = rows || [];
          }
        );

        db.all(
          'SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 10',
          [user.student_id],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.attendance = rows || [];
          }
        );

        db.all(
          'SELECT subject, title, description, due_date FROM homework WHERE class = (SELECT class FROM students WHERE id = ?) ORDER BY due_date ASC',
          [user.student_id],
          (err, rows) => {
            db.close();
            if (err) {
              return reject(err);
            }
            data.homework = rows || [];
            resolve(data);
          }
        );
      });
    } else if (user.role === 'parent') {
      const data = {};

      db.serialize(() => {
        db.get('SELECT * FROM students WHERE id = ?', [user.student_id], (err, student) => {
          if (err) {
            db.close();
            return reject(err);
          }
          data.student = student;
        });

        db.all(
          'SELECT subject, score, max_score, term FROM results WHERE student_id = ?',
          [user.student_id],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.results = rows || [];
          }
        );

        db.all(
          'SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 10',
          [user.student_id],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.attendance = rows || [];
          }
        );

        db.all(
          'SELECT subject, title, description, due_date FROM homework WHERE class = (SELECT class FROM students WHERE id = ?) ORDER BY due_date ASC',
          [user.student_id],
          (err, rows) => {
            db.close();
            if (err) {
              return reject(err);
            }
            data.homework = rows || [];
            resolve(data);
          }
        );
      });
    } else if (user.role === 'teacher') {
      const data = {};

      db.serialize(() => {
        db.all('SELECT * FROM students ORDER BY class, name', [], (err, rows) => {
          if (err) {
            db.close();
            return reject(err);
          }
          data.students = rows || [];
        });

        db.all(
          'SELECT subject, title, description, due_date, class FROM homework ORDER BY due_date ASC',
          [],
          (err, rows) => {
            db.close();
            if (err) {
              return reject(err);
            }
            data.homework = rows || [];
            resolve(data);
          }
        );
      });
    } else if (user.role === 'admin') {
      const data = {};

      db.serialize(() => {
        db.all(
          'SELECT id, name, email, role, student_id FROM users ORDER BY role, name',
          [],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.users = rows || [];
          }
        );

        db.all('SELECT * FROM students ORDER BY class, name', [], (err, rows) => {
          if (err) {
            db.close();
            return reject(err);
          }
          data.students = rows || [];
        });

        db.all(
          `SELECT r.id, s.name AS student_name, r.subject, r.score, r.max_score, r.term
           FROM results r
           JOIN students s ON s.id = r.student_id
           ORDER BY r.term, r.subject`,
          [],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.results = rows || [];
          }
        );

        db.all(
          `SELECT a.id, s.name AS student_name, a.date, a.status
           FROM attendance a
           JOIN students s ON s.id = a.student_id
           ORDER BY a.date DESC`,
          [],
          (err, rows) => {
            if (err) {
              db.close();
              return reject(err);
            }
            data.attendance = rows || [];
          }
        );

        db.all(
          'SELECT id, class, subject, title, description, due_date FROM homework ORDER BY due_date ASC',
          [],
          (err, rows) => {
            db.close();
            if (err) {
              return reject(err);
            }
            data.homework = rows || [];
            resolve(data);
          }
        );
      });
    } else {
      db.close();
      reject(new Error('Unknown role'));
    }
  });
}

module.exports = {
  initDb,
  getUserByEmail,
  getDashboardData,
  createUser,
  DB_PATH
};

