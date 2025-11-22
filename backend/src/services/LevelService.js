import { LevelRepository } from "../repositories/LevelRepository.js";

export class LevelService {
  constructor() {
    this.levelRepository = new LevelRepository();
  }

  async getAllLevels(query) {
    const { page = 1, limit = 20, isActive = "" } = query;

    if (isActive === "true" || isActive === true) {
      const levels = await this.levelRepository.findActive();
      return {
        levels,
        pagination: {
          total: levels.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(levels.length / parseInt(limit)),
        },
      };
    }

    const [levels, total] = await this.levelRepository.findAndCount({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      order: { name: "ASC" },
    });

    return {
      levels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getLevelById(id) {
    const level = await this.levelRepository.findById(parseInt(id));
    if (!level) {
      throw new Error("Level not found");
    }
    return level;
  }

  async createLevel(data) {
    const level = await this.levelRepository.create(data);
    return level;
  }

  async updateLevel(id, data) {
    const level = await this.levelRepository.findById(parseInt(id));
    if (!level) {
      throw new Error("Level not found");
    }

    await this.levelRepository.update(parseInt(id), data);
    return await this.levelRepository.findById(parseInt(id));
  }

  async deleteLevel(id) {
    const deleted = await this.levelRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Level not found");
    }
    return true;
  }
}

