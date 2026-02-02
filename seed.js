const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { hashPassword } = require('./src/utils/auth');
const { initDb } = require('./src/db');

const DB_PATH = path.join(__dirname, 'src', 'data', 'school.db');

async function seed() {
  // Ensure tables exist before seeding
  initDb();

  const db = new sqlite3.Database(DB_PATH);

  const passwordStudent = await hashPassword('password123');
  const passwordParent = await hashPassword('password123');
  const passwordTeacher = await hashPassword('password123');
  const passwordAdmin = await hashPassword('admin123');

  db.serialize(() => {
    // Clear existing data
    db.run('DELETE FROM users');
    db.run('DELETE FROM results');
    db.run('DELETE FROM attendance');
    db.run('DELETE FROM homework');
    db.run('DELETE FROM students');

    // Students
    db.run(
      'INSERT INTO students (name, class) VALUES (?, ?)',
      ['Alice Johnson', '5A'],
      function (err) {
        if (err) {
          console.error('Error inserting student:', err);
          return;
        }

        const aliceId = this.lastID;

        // Users (student & parent linked to Alice)
        db.run(
          'INSERT INTO users (name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, ?)',
          ['Alice Johnson', 'alice@student.com', passwordStudent, 'student', aliceId]
        );

        db.run(
          'INSERT INTO users (name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, ?)',
          ['Alice Parent', 'parent@alice.com', passwordParent, 'parent', aliceId]
        );

        // Teacher user
        db.run(
          'INSERT INTO users (name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, NULL)',
          ['Tom Teacher', 'teacher@school.com', passwordTeacher, 'teacher']
        );

        // Admin user (manages everything)
        db.run(
          'INSERT INTO users (name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, NULL)',
          ['Super Admin', 'admin@school.com', passwordAdmin, 'admin']
        );

        // Results
        const results = [
          ['Mathematics', 88, 100, 'Term 1'],
          ['Science', 92, 100, 'Term 1'],
          ['English', 85, 100, 'Term 1']
        ];

        results.forEach(([subject, score, max, term]) => {
          db.run(
            'INSERT INTO results (student_id, subject, score, max_score, term) VALUES (?, ?, ?, ?, ?)',
            [aliceId, subject, score, max, term]
          );
        });

        // Attendance (last 5 days sample)
        const attendanceData = [
          ['2026-01-28', 'Present'],
          ['2026-01-29', 'Present'],
          ['2026-01-30', 'Late'],
          ['2026-01-31', 'Absent'],
          ['2026-02-01', 'Present']
        ];

        attendanceData.forEach(([date, status]) => {
          db.run(
            'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
            [aliceId, date, status]
          );
        });

        // Homework
        const homeworkItems = [
          ['5A', 'Mathematics', 'Fractions Worksheet', 'Complete page 32, questions 1-10.', '2026-02-05'],
          ['5A', 'Science', 'Plant Life', 'Read chapter 4 and write a short summary.', '2026-02-06'],
          ['5A', 'English', 'Creative Writing', 'Write a one-page story about your weekend.', '2026-02-07']
        ];

        homeworkItems.forEach(([clazz, subject, title, desc, due]) => {
          db.run(
            'INSERT INTO homework (class, subject, title, description, due_date, created_by) VALUES (?, ?, ?, ?, ?, 3)',
            [clazz, subject, title, desc, due]
          );
        });
      }
    );
  });

  console.log('Database seeded successfully.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
});

