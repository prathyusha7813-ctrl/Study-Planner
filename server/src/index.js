const mongoose = require('mongoose');
const { port, mongoUri } = require('./config');
const createApp = require('./app');

async function start() {
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  const server = createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
