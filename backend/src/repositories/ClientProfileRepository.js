import { BaseRepository } from "./BaseRepository.js";
import { ClientProfile } from "../entities/ClientProfile.js";

export class ClientProfileRepository extends BaseRepository {
  constructor() {
    super(ClientProfile);
  }

  async findByUserId(userId) {
    return await this.repository.findOne({
      where: { userId: parseInt(userId) },
      relations: ["user"],
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.repository.createQueryBuilder("profile");

    if (filters.search) {
      queryBuilder.where(
        "(profile.companyName LIKE :search OR profile.industry LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.companyType) {
      if (filters.search) {
        queryBuilder.andWhere("profile.companyType = :companyType", {
          companyType: filters.companyType,
        });
      } else {
        queryBuilder.where("profile.companyType = :companyType", {
          companyType: filters.companyType,
        });
      }
    }

    if (filters.accountStatus) {
      if (filters.search || filters.companyType) {
        queryBuilder.andWhere("profile.accountStatus = :accountStatus", {
          accountStatus: filters.accountStatus,
        });
      } else {
        queryBuilder.where("profile.accountStatus = :accountStatus", {
          accountStatus: filters.accountStatus,
        });
      }
    }

    queryBuilder
      .leftJoinAndSelect("profile.user", "user")
      .orderBy("profile.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    return await queryBuilder.getManyAndCount();
  }
}

