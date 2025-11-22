import { BaseRepository } from "./BaseRepository.js";
import { Certification } from "../entities/Certification.js";

export class CertificationRepository extends BaseRepository {
  constructor() {
    super(Certification);
  }

  async findByUserId(userId) {
    return await this.repository.find({
      where: { userId: parseInt(userId) },
      relations: ["user"],
      order: [
        { issueDate: "DESC" },
        { createdAt: "DESC" },
      ],
    });
  }

  async findByVerificationStatus(status, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { verificationStatus: status },
      relations: ["user"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }
}

