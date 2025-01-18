import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { ScrollArea } from './ui/scroll-area';
import { User } from 'lucide-react';
import api from '../api/axios';

interface ChannelUser {
  _id: string;
  username: string;
  isOnline?: boolean;
}

export function UserList() {
  const { currentChannel } = useStore();
  const [users, setUsers] = useState<ChannelUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentChannel) return;

      try {
        const response = await api.get(`/channels/${currentChannel._id}/users`);
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };

    fetchUsers();
  }, [currentChannel]);

  if (!currentChannel) return null;

  return (
    <div className="w-60 border-l bg-background hidden md:block">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Channel Members</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-2">
          {error ? (
            <div className="text-sm text-destructive p-2">{error}</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.username}</span>
                  {user.isOnline && (
                    <span className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}