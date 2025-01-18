import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import LoadingSpinner from './LoadingSpinner';
import { GuestNameDialog } from './GuestNameDialog';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const { login, loginAsGuest, isLoading, error } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      navigate('/chat');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGuestLogin = async (guestName: string) => {
    try {
      await loginAsGuest();
      navigate('/chat');
    } catch (error) {
      console.error('Guest login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome to Chappy</h1>
          <p className="text-muted-foreground">Sign in to start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : 'Sign In'}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowGuestDialog(true)}
            disabled={isLoading}
          >
            Continue as Guest
          </Button>
        </div>

        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </Card>

      <GuestNameDialog
        open={showGuestDialog}
        onOpenChange={setShowGuestDialog}
        onSubmit={handleGuestLogin}
      />
    </div>
  );
}
