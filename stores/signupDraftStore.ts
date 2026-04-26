import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "49gig-signup-draft";

/** Persisted client signup fields (passwords kept in component state only). */
export type ClientSignupDraft = {
  name: string;
  email: string;
  workEmail: string;
  companyName: string;
  phoneNumber: string;
  companyWebsite: string;
  country: string;
};

/** Persisted freelancer signup fields (passwords kept in component state only). */
export type FreelancerSignupDraft = {
  name: string;
  email: string;
  techField: string;
  softwareDevField: string;
  experienceLevel: string;
  skills: string[];
  languagesWritten: string[];
  otherLanguagesDetail: string;
  phoneCountryCode: string;
  phoneNational: string;
};

const defaultClientDraft = (): ClientSignupDraft => ({
  name: "",
  email: "",
  workEmail: "",
  companyName: "",
  phoneNumber: "",
  companyWebsite: "",
  country: "",
});

const defaultFreelancerDraft = (): FreelancerSignupDraft => ({
  name: "",
  email: "",
  techField: "",
  softwareDevField: "",
  experienceLevel: "",
  skills: [],
  languagesWritten: [],
  otherLanguagesDetail: "",
  phoneCountryCode: "",
  phoneNational: "",
});

type SignupDraftState = {
  client: ClientSignupDraft;
  freelancer: FreelancerSignupDraft;
  freelancerSkillInput: string;
  setClientDraft: (partial: Partial<ClientSignupDraft>) => void;
  setFreelancerDraft: (partial: Partial<FreelancerSignupDraft>) => void;
  setFreelancerSkillInput: (value: string) => void;
  resetClientDraft: () => void;
  resetFreelancerDraft: () => void;
};

export const useSignupDraftStore = create<SignupDraftState>()(
  persist(
    (set) => ({
      client: defaultClientDraft(),
      freelancer: defaultFreelancerDraft(),
      freelancerSkillInput: "",
      setClientDraft: (partial) =>
        set((s) => ({
          client: { ...s.client, ...partial },
        })),
      setFreelancerDraft: (partial) =>
        set((s) => ({
          freelancer: { ...s.freelancer, ...partial },
        })),
      setFreelancerSkillInput: (value) => set({ freelancerSkillInput: value }),
      resetClientDraft: () => set({ client: defaultClientDraft() }),
      resetFreelancerDraft: () =>
        set({
          freelancer: defaultFreelancerDraft(),
          freelancerSkillInput: "",
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        client: state.client,
        freelancer: state.freelancer,
        freelancerSkillInput: state.freelancerSkillInput,
      }),
    }
  )
);
