import { httpServer } from './app';

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();