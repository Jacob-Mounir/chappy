import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface GuestNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (guestName: string) => Promise<void>;
}

export function GuestNameDialog({ open, onOpenChange, onSubmit }: GuestNameDialogProps) {
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = guestName.trim();

    if (!trimmedName) {
      setError('Please enter a name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(trimmedName);
      setGuestName('');
    } catch (error: any) {
      setError(error.message || 'Failed to set guest name');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Guest Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter your guest name"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setError('');
              }}
              disabled={isSubmitting}
              required
              minLength={2}
              maxLength={30}
              className="w-full"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !guestName.trim()}
          >
            {isSubmitting ? 'Continuing...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}