// Jest mock for @/lib/db — prevents DATABASE_URL check during unit tests.
const db = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  execute: jest.fn(),
};
module.exports = { db };
