import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { Toaster } from 'sonner';
import { MainLayout } from './components/MainLayout';
import { Chat } from './components/Chat';
import { UsersList } from './components/UsersList';
import { DirectMessage } from './components/DirectMessage';
import { useAuth, useChat } from './store/useStore';
import { socketService } from './services/socket';

export const App = () => {
  const { checkAuth, user, isLoading } = useAuth();
  const { addMessage } = useChat();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
        const cleanup = socketService.onMessage((message) => {
          addMessage(message);
        });
        return cleanup;
      }
    } else {
      socketService.disconnect();
    }
  }, [user, addMessage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Chat />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/dm/:userId" element={<DirectMessage />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </Router>
  );
};

export default App;
