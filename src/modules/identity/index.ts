/** Public surface of the identity module. Other modules import only from here. */
export {
  communicationPrefsSchema,
  isValidTimezone,
  MAX_PRIORITIES,
  onboardingStateSchema,
  profileUpdateSchema,
  type CommunicationPrefs,
  type OnboardingState,
  type Priority,
  type ProfileUpdate,
} from "./domain/profile";
export { ensureProfile, getProfile, updateProfile } from "./server/profile-repository";
export type { UserProfileRow } from "./server/schema";
