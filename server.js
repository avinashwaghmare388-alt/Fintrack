import mongoose from 'mongoose';

// Config is imported inside try, so a bad .env prints a clear message instead of a stack trace.
const start = async () => {
  try {
    const { config } = await import('./config/env.js');
    const { connectDB } = await import('./config/db.js');
    const { createApp } = await import('./app.js');

    await connectDB();
    const server = createApp().listen(config.port, () => {
      console.log(`Server running on port ${config.port} (${config.env})`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason instanceof Error ? reason.message : reason);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    console.error(error.message);
    if (/ECONNREFUSED 127\.0\.0\.1|ECONNREFUSED ::1|connect ECONNREFUSED/.test(error.message) && !/querySrv/.test(error.message)) {
      console.error(
        '\nMongoDB is not reachable. If you use a local database, install and start MongoDB Community Server,\n' +
          'or put a MongoDB Atlas connection string in MONGODB_URI in server/.env'
      );
    }
    if (/querySrv/.test(error.message)) {
      console.error(
        '\nYour network is blocking the DNS lookup used by mongodb+srv:// links.\n' +
          'Use the long mongodb:// link from Atlas (Connect > Drivers > version 2.2.12 or later),\n' +
          'or install MongoDB locally and set MONGODB_URI=mongodb://127.0.0.1:27017/ai-finance-tracker'
      );
    }
    process.exit(1);
  }
};

start();
