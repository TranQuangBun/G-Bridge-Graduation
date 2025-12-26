import { BaseRepository } from "./BaseRepository.js";
import { Domain } from "../entities/Domain.js";

export class DomainRepository extends BaseRepository {
  constructor() {
    super(Domain);
  }

  async findActive() {
    return await this.repository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }
}

