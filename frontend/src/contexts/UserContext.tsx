import { createContext, useContext } from 'react';
import { useAuth } from '../store/useStore';

type UserContextType = {
  userState: {
    type: 'authenticated';
    userId: string;
    username: string;
  } | {
    type: 'guest';
    username: string;
  } | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const userState = user ? {
    type: 'authenticated' as const,
    userId: user._id,
    username: user.username
  } : {
    type: 'guest' as const,
    username: 'Guest'
  };

  return (
    <UserContext.Provider value={{ userState }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}