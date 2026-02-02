const bcrypt = require('bcryptjs');

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function comparePassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};

