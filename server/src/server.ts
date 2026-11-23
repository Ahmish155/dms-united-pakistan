import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    await connectDB();
    const port = parseInt(ENV.PORT, 10);
    app.listen(port, () => {
      console.log(`[DMS Server] Running on http://localhost:${port} in ${ENV.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('[DMS Server] Startup error:', error);
    process.exit(1);
  }
};

startServer();
