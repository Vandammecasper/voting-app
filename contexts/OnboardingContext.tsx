import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { isOnboardingCompleted, setOnboardingCompleted } from '@/services/onboardingStorage';

type OnboardingContextValue = {
  onboarded: boolean | null;
  markCompleted: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingCompleted()
      .then(setOnboarded)
      .catch(() => setOnboarded(false));
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      onboarded,
      markCompleted: async () => {
        await setOnboardingCompleted();
        setOnboarded(true);
      },
    }),
    [onboarded]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
