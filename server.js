const db = require('./server/db');
const app = require('./server/app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Initializing SQLite database engine...');
    await db.init();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`Document Tracking System (DTS) running at http://localhost:${PORT}`);
      console.log('Created by Theekshana Rajapaksha | Version 1.0');
      console.log('================================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
