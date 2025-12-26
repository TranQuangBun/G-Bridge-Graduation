import { BaseRepository } from "./BaseRepository.js";
import { Language } from "../entities/Language.js";

export class LanguageRepository extends BaseRepository {
  constructor() {
    super(Language);
  }

  async findByUserId(userId) {
    return await this.repository.find({
      where: { userId: parseInt(userId) },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async findByUserAndName(userId, name) {
    return await this.repository.findOne({
      where: {
        userId: parseInt(userId),
        name,
      },
    });
  }
}

