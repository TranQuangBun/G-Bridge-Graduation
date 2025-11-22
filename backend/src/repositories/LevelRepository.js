import { BaseRepository } from "./BaseRepository.js";
import { Level } from "../entities/Level.js";

export class LevelRepository extends BaseRepository {
  constructor() {
    super(Level);
  }

  async findActive() {
    return await this.repository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }
}

