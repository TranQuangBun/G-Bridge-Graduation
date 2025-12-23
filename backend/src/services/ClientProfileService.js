import { ClientProfileRepository } from "../repositories/ClientProfileRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";

export class ClientProfileService {
  constructor() {
    this.clientProfileRepository = new ClientProfileRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllClientProfiles(query) {
    const {
      page = 1,
      limit = 20,
      search = "",
      companyType = "",
      accountStatus = "",
    } = query;

    const filters = {};
    if (search) filters.search = search;
    if (companyType) filters.companyType = companyType;
    if (accountStatus) filters.accountStatus = accountStatus;

    const [profiles, total] = await this.clientProfileRepository.findByFilters(
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

  async getClientProfileById(id) {
    const profile = await this.clientProfileRepository.findById(parseInt(id), {
      relations: ["user"],
    });
    if (!profile) {
      throw new Error("Client profile not found");
    }
    return profile;
  }

  async getClientProfileByUserId(userId) {
    const profile = await this.clientProfileRepository.findByUserId(
      parseInt(userId)
    );
    if (!profile) {
      throw new Error("Client profile not found");
    }
    return profile;
  }

  async createClientProfile(data) {
    const { userId, ...profileData } = data;

    if (!userId) {
      throw new Error("userId is required");
    }

    // Verify user exists and is client
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId), role: "client" },
    });

    if (!user) {
      throw new Error("User not found or is not a client");
    }

    // Check if profile already exists
    const existing = await this.clientProfileRepository.findByUserId(userId);
    if (existing) {
      throw new Error("Client profile already exists for this user");
    }

    const profile = await this.clientProfileRepository.create({
      userId: parseInt(userId),
      ...profileData,
    });

    return profile;
  }

  async updateClientProfile(id, data) {
    const profile = await this.clientProfileRepository.findById(parseInt(id));
    if (!profile) {
      throw new Error("Client profile not found");
    }

    // Validate and normalize companySize enum value
    const { CompanySize } = await import("../entities/ClientProfile.js");
    if (data.companySize) {
      const validSizes = Object.values(CompanySize);
      // Map old value to new value if needed
      if (data.companySize === "size_1001_plus") {
        data.companySize = CompanySize.SIZE_1000_PLUS;
      } else if (!validSizes.includes(data.companySize)) {
        // If invalid value, set to null instead of throwing error
        console.warn(`Invalid companySize value: ${data.companySize}, setting to null`);
        data.companySize = null;
      }
    }

    // Validate companyType enum value
    const { CompanyType } = await import("../entities/ClientProfile.js");
    if (data.companyType) {
      const validTypes = Object.values(CompanyType);
      if (!validTypes.includes(data.companyType)) {
        console.warn(`Invalid companyType value: ${data.companyType}, setting to null`);
        data.companyType = null;
      }
    }

    await this.clientProfileRepository.update(parseInt(id), data);
    return await this.clientProfileRepository.findById(parseInt(id), {
      relations: ["user"],
    });
  }

  async deleteClientProfile(id) {
    const deleted = await this.clientProfileRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Client profile not found");
    }
    return true;
  }
}

