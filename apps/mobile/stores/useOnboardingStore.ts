import { create } from 'zustand';

interface OnboardingState {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  birthTime: Date | null;
  birthTimeUnknown: boolean;
  birthPlace: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  currentStep: number;
}

interface OnboardingActions {
  setField: <K extends keyof OnboardingState>(field: K, value: OnboardingState[K]) => void;
  setStep: (step: number) => void;
  reset: () => void;
  isComplete: () => boolean;
}

const initialState: OnboardingState = {
  firstName: '',
  lastName: '',
  birthDate: null,
  birthTime: null,
  birthTimeUnknown: false,
  birthPlace: '',
  latitude: null,
  longitude: null,
  timezone: '',
  currentStep: 0,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  (set, get) => ({
    ...initialState,

    setField: (field, value) => set({ [field]: value }),

    setStep: (step) => set({ currentStep: step }),

    reset: () => set(initialState),

    isComplete: () => {
      const state = get();
      return (
        state.firstName.length >= 2 &&
        state.lastName.length >= 2 &&
        state.birthDate !== null &&
        state.birthPlace.length > 0
      );
    },
  })
);
