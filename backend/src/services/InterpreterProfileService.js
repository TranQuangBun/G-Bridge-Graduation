import { InterpreterProfileRepository } from "../repositories/InterpreterProfileRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";

export class InterpreterProfileService {
  constructor() {
    this.interpreterProfileRepository = new InterpreterProfileRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllInterpreterProfiles(query) {
    const {
      page = 1,
      limit = 20,
      verificationStatus = "",
      isAvailable = "",
    } = query;

    const filters = {};
    if (verificationStatus) filters.verificationStatus = verificationStatus;
    if (isAvailable !== "") filters.isAvailable = isAvailable;

    const [profiles, total] =
      await this.interpreterProfileRepository.findByFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

    return {
      profiles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getInterpreterProfileById(id) {
    const profile = await this.interpreterProfileRepository.findById(
      parseInt(id),
      { relations: ["user"] }
    );
    if (!profile) {
      throw new Error("Interpreter profile not found");
    }
    return profile;
  }

  async getInterpreterProfileByUserId(userId) {
    const profile = await this.interpreterProfileRepository.findByUserId(
      parseInt(userId)
    );
    if (!profile) {
      throw new Error("Interpreter profile not found");
    }
    return profile;
  }

  async createInterpreterProfile(data) {
    const { userId, ...profileData } = data;

    if (!userId) {
      throw new Error("userId is required");
    }

    // Verify user exists and is interpreter
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId), role: "interpreter" },
    });

    if (!user) {
      throw new Error("User not found or is not an interpreter");
    }

    // Check if profile already exists
    const existing = await this.interpreterProfileRepository.findByUserId(
      userId
    );
    if (existing) {
      throw new Error("Interpreter profile already exists for this user");
    }

    const profile = await this.interpreterProfileRepository.create({
      userId: parseInt(userId),
      languages: profileData.languages || [],
      ...profileData,
    });

    return profile;
  }

  async updateInterpreterProfile(id, data) {
    const profile = await this.interpreterProfileRepository.findById(
      parseInt(id)
    );
    if (!profile) {
      throw new Error("Interpreter profile not found");
    }

    await this.interpreterProfileRepository.update(parseInt(id), data);
    return await this.interpreterProfileRepository.findById(parseInt(id), {
      relations: ["user"],
    });
  }

  async deleteInterpreterProfile(id) {
    const deleted = await this.interpreterProfileRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Interpreter profile not found");
    }
    return true;
  }
}

