import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import api from '../lib/api';
import type { User } from '../types/chat';

export const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<User[]>('/api/users');
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = async (userId: string) => {
    try {
      // Navigate to DM chat with this user
      navigate(`/dm/${userId}`);
    } catch (error) {
      console.error('Error opening DM:', error);
      setError('Failed to open direct message');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <div className="space-y-2">
        {users.map(user => (
          <div
            key={user._id}
            onClick={() => handleUserClick(user._id)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div className="flex-1">
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-400">
                {user.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};