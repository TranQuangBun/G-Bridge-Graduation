import { UserRepository } from "../repositories/UserRepository.js";
import { InterpreterProfileRepository } from "../repositories/InterpreterProfileRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { NotFoundError } from "../utils/Errors.js";
import { updateProfileCompleteness } from "../utils/ProfileCompleteness.js";

export class UserProfileService {
  constructor() {
    this.userRepository = new UserRepository();
    this.interpreterProfileRepository = new InterpreterProfileRepository();
  }

  async getUserById(userId) {
    const user = await this.userRepository.findByIdWithProfiles(
      parseInt(userId)
    );
    if (!user) {
      throw new NotFoundError("User");
    }
    return user;
  }

  async updateUserBasicInfo(userId, updateData) {
    const user = await this.userRepository.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError("User");
    }

    const { fullName, phone, address, email } = updateData;

    if (email && email !== user.email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing) {
        throw new Error("Email already exists");
      }
    }

    const updatePayload = {};
    if (fullName !== undefined) updatePayload.fullName = fullName;
    if (phone !== undefined) updatePayload.phone = phone;
    if (address !== undefined) updatePayload.address = address;
    if (email !== undefined) updatePayload.email = email;

    const updated = await this.userRepository.update(
      parseInt(userId),
      updatePayload
    );

    // Update profile completeness if user is interpreter
    if (updated.role === "interpreter") {
      await updateProfileCompleteness(parseInt(userId));
    }

    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return userResponse;
  }

  async updateInterpreterProfileData(userId, profileData) {
    const profile = await this.interpreterProfileRepository.findByUserId(
      parseInt(userId)
    );
    if (!profile) {
      throw new NotFoundError("Interpreter profile");
    }

    // Ensure specializations is properly formatted as array
    const updateData = { ...profileData     };

    if (updateData.specializations !== undefined) {
      // Ensure it's an array
      if (Array.isArray(updateData.specializations)) {
        // Filter out empty strings and trim - but keep the array even if empty
        updateData.specializations = updateData.specializations
          .filter(
            (spec) => spec && typeof spec === "string" && spec.trim().length > 0
          )
          .map((spec) => spec.trim());

        console.log("Processed specializations array:", {
          original: profileData.specializations,
          processed: updateData.specializations,
          length: updateData.specializations.length,
        });
      } else if (typeof updateData.specializations === "string") {
        // If it's a string, try to parse it or convert to array
        try {
          const parsed = JSON.parse(updateData.specializations);
          updateData.specializations = Array.isArray(parsed)
            ? parsed
                .filter(
                  (spec) =>
                    spec && typeof spec === "string" && spec.trim().length > 0
                )
                .map((spec) => spec.trim())
            : [];
        } catch {
          // If not valid JSON, treat as single value or empty array
          updateData.specializations = updateData.specializations.trim()
            ? [updateData.specializations.trim()]
            : [];
        }
      } else {
        updateData.specializations = [];
      }
    }

    // Update fields individually to ensure proper handling
    if (updateData.hourlyRate !== undefined) {
      profile.hourlyRate = updateData.hourlyRate;
    }
    if (updateData.experience !== undefined) {
      profile.experience = updateData.experience;
    }
    if (updateData.portfolio !== undefined) {
      profile.portfolio = updateData.portfolio;
    }

    // Explicitly set specializations - ensure it's properly formatted
    if (updateData.specializations !== undefined) {
      // Ensure it's an array for JSON column
      const specializationsArray = Array.isArray(updateData.specializations)
        ? updateData.specializations
        : [];

      // Use query builder to explicitly update JSON field if needed
      // But first try with save() which should work
      profile.specializations = specializationsArray;

      console.log("Setting specializations on profile entity:", {
        value: profile.specializations,
        type: typeof profile.specializations,
        isArray: Array.isArray(profile.specializations),
        length: profile.specializations.length,
      });
    }

    // Save the profile entity - TypeORM should handle JSON serialization
    const savedProfile =
      await this.interpreterProfileRepository.repository.save(profile);

    console.log("Saved profile (immediately after save):", {
      profileId: savedProfile.id,
      specializations: savedProfile.specializations,
      specializationsType: typeof savedProfile.specializations,
      isArray: Array.isArray(savedProfile.specializations),
      stringified: JSON.stringify(savedProfile.specializations),
    });

    // Update profile completeness
    await updateProfileCompleteness(parseInt(userId));

    // Reload from database to get fresh data (in case of caching)
    const updatedProfile =
      await this.interpreterProfileRepository.repository.findOne({
        where: { id: savedProfile.id },
        relations: ["user"],
      });

    console.log("Reloaded profile from database:", {
      profileId: updatedProfile.id,
      specializations: updatedProfile.specializations,
      specializationsType: typeof updatedProfile.specializations,
      isArray: Array.isArray(updatedProfile.specializations),
      stringified: JSON.stringify(updatedProfile.specializations),
    });

    return updatedProfile;
  }

  async updateUserAvatar(userId, avatarUrl) {
    const user = await this.userRepository.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError("User");
    }

    const updated = await this.userRepository.update(parseInt(userId), {
      avatar: avatarUrl,
    });
    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return userResponse;
  }

  async updateClientProfileBusinessLicense(userId, licenseUrl) {
    const user = await this.userRepository.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.role !== "client") {
      throw new AppError("Only clients can upload business license", 403);
    }

    // Get or create client profile
    let clientProfile = user.clientProfile;
    if (!clientProfile) {
      // Create new client profile if doesn't exist
      const ClientProfileRepository =
        require("../repositories/ClientProfileRepository.js").ClientProfileRepository;
      const clientProfileRepo = new ClientProfileRepository();
      clientProfile = await clientProfileRepo.create({
        userId: parseInt(userId),
        businessLicense: licenseUrl,
        licenseVerificationStatus: "pending",
      });
    } else {
      // Update existing client profile
      const ClientProfileRepository =
        require("../repositories/ClientProfileRepository.js").ClientProfileRepository;
      const clientProfileRepo = new ClientProfileRepository();
      clientProfile = await clientProfileRepo.update(clientProfile.id, {
        businessLicense: licenseUrl,
        licenseVerificationStatus: "pending",
      });
    }

    return clientProfile;
  }

  async toggleUserActiveStatus(userId) {
    const user = await this.userRepository.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError("User");
    }

    // Toggle isActive status
    const newStatus = !user.isActive;
    const updated = await this.userRepository.update(parseInt(userId), {
      isActive: newStatus,
    });
    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return userResponse;
  }
}

const userProfileService = new UserProfileService();

export async function getUserById(userId) {
  return await userProfileService.getUserById(userId);
}

export async function updateUserBasicInfo(userId, updateData) {
  return await userProfileService.updateUserBasicInfo(userId, updateData);
}

export async function updateInterpreterProfileData(userId, profileData) {
  return await userProfileService.updateInterpreterProfileData(
    userId,
    profileData
  );
}

export async function updateUserAvatar(userId, avatarUrl) {
  return await userProfileService.updateUserAvatar(userId, avatarUrl);
}

export async function updateClientProfileBusinessLicense(userId, licenseUrl) {
  return await userProfileService.updateClientProfileBusinessLicense(
    userId,
    licenseUrl
  );
}

export async function toggleUserActiveStatus(userId) {
  return await userProfileService.toggleUserActiveStatus(userId);
}
