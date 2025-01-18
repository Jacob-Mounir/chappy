import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { MainLayout } from './components/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DirectMessages } from './pages/DirectMessages';
import { CreateChannel } from './pages/CreateChannel';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useStore } from './store/useStore';
import { useEffect } from 'react';

function App() {
  const { isInitialized, checkAuth, userState } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isLoggedIn = userState?.type === 'authenticated' || userState?.type === 'guest';

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/chat" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <Navigate to="/chat" replace /> : <Register />}
          />

          <Route
            path="/chat/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route index element={<MainLayout />} />
                  <Route
                    path="channels/new"
                    element={
                      userState?.type === 'authenticated' ? <CreateChannel /> : <Navigate to="/chat" replace />
                    }
                  />
                </Routes>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <DirectMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <DirectMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={isLoggedIn ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
