import { UserRepository } from "../repositories/UserRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(query) {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      isActive = "",
      isVerified = "",
    } = query;

    const [users, total] = await this.userRepository.searchUsers(
      search,
      role,
      isActive,
      isVerified,
      parseInt(page),
      parseInt(limit)
    );

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getUserById(id) {
    const user = await this.userRepository.findByIdWithProfiles(parseInt(id));
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async createUser(userData) {
    const { passwordHash, ...data } = userData;

    // Check if email already exists
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("Email already exists");
    }

    const user = await this.userRepository.create({
      ...data,
      passwordHash: passwordHash || "default_hash", // Should be hashed in production
    });

    const userResponse = { ...user };
    delete userResponse.passwordHash;
    return userResponse;
  }

  async updateUser(id, userData) {
    const { passwordHash, ...data } = userData;

    const user = await this.userRepository.findById(parseInt(id));
    if (!user) {
      throw new Error("User not found");
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new Error("Email already exists");
      }
    }

    const updatePayload = { ...data };
    if (passwordHash) {
      updatePayload.passwordHash = passwordHash; // Should be hashed in production
    }

    const updated = await this.userRepository.update(parseInt(id), updatePayload);
    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return userResponse;
  }

  async deleteUser(id) {
    const user = await this.userRepository.findById(parseInt(id));
    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.delete(parseInt(id));
    return true;
  }
}

