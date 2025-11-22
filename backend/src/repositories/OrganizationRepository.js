import { BaseRepository } from "./BaseRepository.js";
import { Organization } from "../entities/Organization.js";
import { Like } from "typeorm";

export class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }

  async searchOrganizations(search, province, isActive, page = 1, limit = 20, ownerUserId = "") {
    const offset = (page - 1) * limit;
    const queryBuilder = this.repository.createQueryBuilder("organization");

    if (search) {
      queryBuilder.where(
        "(organization.name LIKE :search OR organization.description LIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (province) {
      if (search) {
        queryBuilder.andWhere("organization.province = :province", { province });
      } else {
        queryBuilder.where("organization.province = :province", { province });
      }
    }

    if (isActive !== undefined && isActive !== "") {
      const isActiveValue = isActive === "true" || isActive === true;
      if (search || province) {
        queryBuilder.andWhere("organization.isActive = :isActive", {
          isActive: isActiveValue,
        });
      } else {
        queryBuilder.where("organization.isActive = :isActive", {
          isActive: isActiveValue,
        });
      }
    }

    if (ownerUserId) {
      const ownerId = parseInt(ownerUserId);
      if (Number.isInteger(ownerId)) {
        if (queryBuilder.expressionMap.wheres.length > 0) {
          queryBuilder.andWhere("organization.ownerUserId = :ownerUserId", {
            ownerUserId: ownerId,
          });
        } else {
          queryBuilder.where("organization.ownerUserId = :ownerUserId", {
            ownerUserId: ownerId,
          });
        }
      }
    }

    queryBuilder
      .orderBy("organization.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    return await queryBuilder.getManyAndCount();
  }
}

