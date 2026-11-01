import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { listUsers } from '../api/client';
import type { User } from '../types';

interface UserContextValue {
  users: User[];
  currentUser: User | null;
  setCurrentUserId: (id: number) => void;
  refreshUsers: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      setCurrentUserId((prev) => prev ?? data[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUsers();
  }, []);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUserId: (id: number) => setCurrentUserId(id),
        refreshUsers,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used inside <UserProvider>');
  return ctx;
}