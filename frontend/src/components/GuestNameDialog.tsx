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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      await onSubmit(guestName.trim());
      onOpenChange(false);
      setGuestName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Guest Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter your guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}