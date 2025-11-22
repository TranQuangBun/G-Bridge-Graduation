import { UserRepository } from "../repositories/UserRepository.js";
import { InterpreterProfileRepository } from "../repositories/InterpreterProfileRepository.js";

/**
 * Calculate profile completeness percentage for interpreter
 * Checks: phone, address, languages (from User), certifications (from User), 
 * specializations, experience, hourlyRate, portfolio
 * Note: fullName is not included as it's required during registration
 */
export const calculateProfileCompleteness = (user, profile) => {
  if (!user || !profile || user.role !== "interpreter") {
    return 0;
  }

  let completeness = 0;
  const totalFields = 8; // Changed from 9 to 8 (removed fullName)
  const pointsPerField = 100 / totalFields;

  // User basic info (2 fields) - fullName is required, so not counted
  if (user.phone && user.phone.trim().length > 0) completeness += pointsPerField;
  if (user.address && user.address.trim().length > 0) completeness += pointsPerField;

  // Languages from User entity (1 field)
  const hasLanguages = user.languages && Array.isArray(user.languages) && user.languages.length > 0;
  if (hasLanguages) completeness += pointsPerField;

  // Certifications from User entity (1 field)
  const hasCertifications = user.certifications && Array.isArray(user.certifications) && user.certifications.length > 0;
  if (hasCertifications) completeness += pointsPerField;

  // Profile professional info (4 fields)
  const hasSpecializations = profile.specializations && Array.isArray(profile.specializations) && profile.specializations.length > 0;
  if (hasSpecializations) completeness += pointsPerField;
  
  if (profile.experience && typeof profile.experience === 'number' && profile.experience > 0) {
    completeness += pointsPerField;
  }
  
  if (profile.hourlyRate && (typeof profile.hourlyRate === 'number' || typeof profile.hourlyRate === 'string')) {
    const rate = typeof profile.hourlyRate === 'string' ? parseFloat(profile.hourlyRate) : profile.hourlyRate;
    if (rate > 0) completeness += pointsPerField;
  }
  
  if (profile.portfolio && typeof profile.portfolio === 'string' && profile.portfolio.trim().length > 0) {
    completeness += pointsPerField;
  }

  // Ensure completeness doesn't exceed 100%
  return Math.min(Math.round(completeness), 100);
};

/**
 * Update profile completeness for an interpreter user
 * @param {number} userId - User ID
 */
export const updateProfileCompleteness = async (userId) => {
  try {
    const userRepository = new UserRepository();
    const interpreterProfileRepository = new InterpreterProfileRepository();

    // Get user with all relations
    const user = await userRepository.findByIdWithProfiles(userId);
    
    if (!user || user.role !== "interpreter" || !user.interpreterProfile) {
      return;
    }

    // Calculate completeness
    const completeness = calculateProfileCompleteness(user, user.interpreterProfile);

    // Update profile completeness
    await interpreterProfileRepository.update(user.interpreterProfile.id, {
      profileCompleteness: completeness,
    });

    return completeness;
  } catch (error) {
    console.error("Error updating profile completeness:", error);
    // Don't throw error, just log it
  }
};

