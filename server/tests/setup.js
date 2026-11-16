const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Uses an in-memory MongoDB by default. Set MONGO_URI_TEST to use a real
// (throwaway!) database instead — it is dropped after the run.
async function connect() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-1234';
  let uri = process.env.MONGO_URI_TEST;
  if (!uri) {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri('study-planner-test');
  }
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

async function clear() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

async function disconnect() {
  if (process.env.MONGO_URI_TEST) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clear, disconnect };
