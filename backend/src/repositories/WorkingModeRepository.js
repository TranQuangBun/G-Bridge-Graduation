import { BaseRepository } from "./BaseRepository.js";
import { WorkingMode } from "../entities/WorkingMode.js";

export class WorkingModeRepository extends BaseRepository {
  constructor() {
    super(WorkingMode);
  }

  async findActive() {
    return await this.repository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }
}

