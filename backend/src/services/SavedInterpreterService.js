import { SavedInterpreterRepository } from "../repositories/SavedInterpreterRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";

export class SavedInterpreterService {
  constructor() {
    this.savedInterpreterRepository = new SavedInterpreterRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllSavedInterpreters(query) {
    const {
      page = 1,
      limit = 20,
      userId = "",
      interpreterId = "",
    } = query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (interpreterId) filters.interpreterId = interpreterId;

    const [savedInterpreters, total] =
      await this.savedInterpreterRepository.findByFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

    return {
      savedInterpreters,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getSavedInterpreterById(userId, interpreterId) {
    const savedInterpreter =
      await this.savedInterpreterRepository.findByUserAndInterpreter(
        userId,
        interpreterId
      );
    if (!savedInterpreter) {
      throw new Error("Saved interpreter not found");
    }
    return savedInterpreter;
  }

  async createSavedInterpreter(data) {
    const { userId, interpreterId } = data;

    if (!userId || !interpreterId) {
      throw new Error("userId and interpreterId are required");
    }

    // Check if already saved
    const existing =
      await this.savedInterpreterRepository.findByUserAndInterpreter(
        userId,
        interpreterId
      );
    if (existing) {
      throw new Error("Interpreter already saved");
    }

    // Verify users exist
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId) },
    });
    const interpreter = await this.userRepository.findOne({
      where: { id: parseInt(interpreterId) },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!interpreter) {
      throw new Error("Interpreter not found");
    }

    const savedInterpreter = await this.savedInterpreterRepository.create({
      userId: parseInt(userId),
      interpreterId: parseInt(interpreterId),
      savedDate: new Date(),
    });

    return savedInterpreter;
  }

  async deleteSavedInterpreter(userId, interpreterId) {
    const deleted =
      await this.savedInterpreterRepository.deleteByUserAndInterpreter(
        userId,
        interpreterId
      );
    if (!deleted) {
      throw new Error("Saved interpreter not found");
    }
    return true;
  }
}

