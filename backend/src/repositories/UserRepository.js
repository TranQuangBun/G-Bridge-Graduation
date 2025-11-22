import { BaseRepository } from "./BaseRepository.js";
import { User } from "../entities/User.js";

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async searchUsers(search, role, isActive, isVerified, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.repository.createQueryBuilder("user");

    if (search) {
      queryBuilder.where(
        "(user.fullName LIKE :search OR user.email LIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (role) {
      if (search) {
        queryBuilder.andWhere("user.role = :role", { role });
      } else {
        queryBuilder.where("user.role = :role", { role });
      }
    }

    if (isActive !== undefined && isActive !== "") {
      const isActiveValue = isActive === "true" || isActive === true;
      if (search || role) {
        queryBuilder.andWhere("user.isActive = :isActive", {
          isActive: isActiveValue,
        });
      } else {
        queryBuilder.where("user.isActive = :isActive", {
          isActive: isActiveValue,
        });
      }
    }

    if (isVerified !== undefined && isVerified !== "") {
      const isVerifiedValue = isVerified === "true" || isVerified === true;
      if (search || role || (isActive !== undefined && isActive !== "")) {
        queryBuilder.andWhere("user.isVerified = :isVerified", {
          isVerified: isVerifiedValue,
        });
      } else {
        queryBuilder.where("user.isVerified = :isVerified", {
          isVerified: isVerifiedValue,
        });
      }
    }

    queryBuilder
      .leftJoinAndSelect("user.interpreterProfile", "interpreterProfile")
      .leftJoinAndSelect("user.clientProfile", "clientProfile")
      .select([
        "user.id",
        "user.fullName",
        "user.email",
        "user.role",
        "user.phone",
        "user.address",
        "user.avatar",
        "user.isActive",
        "user.isVerified",
        "user.isPremium",
        "user.premiumExpiresAt",
        "user.lastLoginAt",
        "user.createdAt",
        "user.updatedAt",
      ])
      .orderBy("user.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    return await queryBuilder.getManyAndCount();
  }

  async findByIdWithProfiles(id) {
    return await this.repository.findOne({
      where: { id },
      select: [
        "id",
        "fullName",
        "email",
        "role",
        "phone",
        "address",
        "avatar",
        "isActive",
        "isVerified",
        "isPremium",
        "premiumExpiresAt",
        "lastLoginAt",
        "createdAt",
        "updatedAt",
      ],
      relations: ["interpreterProfile", "clientProfile", "languages", "certifications"],
    });
  }
}

