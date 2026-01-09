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

    // Build WHERE conditions properly
    const conditions = [];
    const parameters = {};

    if (search) {
      conditions.push("(user.fullName LIKE :search OR user.email LIKE :search)");
      parameters.search = `%${search}%`;
    }

    if (role && role !== "") {
      conditions.push("user.role = :role");
      parameters.role = role;
    }

    if (isActive !== undefined && isActive !== "") {
      const isActiveValue = isActive === "true" || isActive === true;
      conditions.push("user.isActive = :isActive");
      parameters.isActive = isActiveValue;
    }

    if (isVerified !== undefined && isVerified !== "") {
      const isVerifiedValue = isVerified === "true" || isVerified === true;
      conditions.push("user.isVerified = :isVerified");
      parameters.isVerified = isVerifiedValue;
    }

    // Apply all conditions at once
    if (conditions.length > 0) {
      queryBuilder.where(conditions.join(" AND "), parameters);
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
        "user.isPublic",
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
        "isPublic",
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

