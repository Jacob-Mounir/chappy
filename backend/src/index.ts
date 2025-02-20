import { httpServer, initializeServer } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async () => {
  try {
    await initializeServer();

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

    // Handle server errors
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();