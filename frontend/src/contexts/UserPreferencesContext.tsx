import React, { createContext, useContext, useState, useEffect } from 'react';
import { MusicalKey, NotationSystem } from '../types';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

interface UserPreferencesContextType {
  preferredKey: MusicalKey;
  notationSystem: NotationSystem;
  accidentalSystem: 'sharp' | 'flat';
  standartPitch: number;
  setPreferredKey: (key: MusicalKey) => Promise<void>;
  setNotationSystem: (system: NotationSystem) => Promise<void>;
  setAccidentalSystem: (system: 'sharp' | 'flat') => Promise<void>;
  setStandartPitch: (pitch: number) => Promise<void>;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [preferredKey, setPreferredKeyState] = useState<MusicalKey>('C');
  const [notationSystem, setNotationSystemState] =
    useState<NotationSystem>('ABC');
  const [accidentalSystem, setAccidentalSystemState] = useState<
    'sharp' | 'flat'
  >('sharp');
  const [standartPitch, setStandartPitchState] = useState<number>(440);
  const [isLoading, setIsLoading] = useState(false);

  // Update preferences when user changes
  useEffect(() => {
    if (user) {
      // Note: backend uses standartPitch instead of preferredKey
      setPreferredKeyState('C'); // Default since backend doesn't have preferredKey
      setNotationSystemState(user.notationSystem);
      setAccidentalSystemState(user.accidentalSystem);
      setStandartPitchState(user.standartPitch);
    }
  }, [user]);

  const updateUserPreferences = async (updates: any) => {
    setIsLoading(true);
    try {
      const updatedUser = await userService.updateProfile(updates);
      updateUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setPreferredKey = async (key: MusicalKey) => {
    if (!isAuthenticated) {
      setPreferredKeyState(key);
      return;
    }

    try {
      // Since backend doesn't have preferredKey, we'll just store locally
      setPreferredKeyState(key);
    } catch (error) {
      toast.error('Failed to update preferred key');
    }
  };

  const setNotationSystem = async (system: NotationSystem) => {
    if (!isAuthenticated) {
      setNotationSystemState(system);
      return;
    }

    try {
      await updateUserPreferences({ notationSystem: system });
      setNotationSystemState(system);
    } catch (error) {
      toast.error('Failed to update notation system');
    }
  };

  const setAccidentalSystem = async (system: 'sharp' | 'flat') => {
    if (!isAuthenticated) {
      setAccidentalSystemState(system);
      return;
    }

    try {
      await updateUserPreferences({ accidentalSystem: system });
      setAccidentalSystemState(system);
    } catch (error) {
      toast.error('Failed to update accidental system');
    }
  };

  const setStandartPitch = async (pitch: number) => {
    if (!isAuthenticated) {
      setStandartPitchState(pitch);
      return;
    }

    try {
      await updateUserPreferences({ standartPitch: pitch });
      setStandartPitchState(pitch);
    } catch (error) {
      toast.error('Failed to update standard pitch');
    }
  };
  const value: UserPreferencesContextType = {
    preferredKey,
    notationSystem,
    accidentalSystem,
    standartPitch,
    setPreferredKey,
    setNotationSystem,
    setAccidentalSystem,
    setStandartPitch,
    isLoading,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider'
    );
  }
  return context;
}
