import { BaseRepository } from "./BaseRepository.js";
import { Job } from "../entities/Job.js";
import { Like } from "typeorm";

export class JobRepository extends BaseRepository {
  constructor() {
    super(Job);
  }

  async findByOrganization(organizationId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { organizationId: parseInt(organizationId) },
      relations: ["organization", "workingMode", "domains", "requiredLanguages", "requiredCertificates"],
      take: limit,
      skip: offset,
      order: { createdDate: "DESC" },
    });
  }

  async findByStatus(status, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { statusOpenStop: status },
      relations: ["organization", "workingMode", "domains", "requiredLanguages", "requiredCertificates"],
      take: limit,
      skip: offset,
      order: { createdDate: "DESC" },
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.repository.createQueryBuilder("job");

    if (filters.search) {
      queryBuilder.where(
        "(job.title LIKE :search OR job.description LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.organizationId) {
      if (filters.search) {
        queryBuilder.andWhere("job.organizationId = :organizationId", {
          organizationId: parseInt(filters.organizationId),
        });
      } else {
        queryBuilder.where("job.organizationId = :organizationId", {
          organizationId: parseInt(filters.organizationId),
        });
      }
    }

    if (filters.workingModeId) {
      if (filters.search || filters.organizationId) {
        queryBuilder.andWhere("job.workingModeId = :workingModeId", {
          workingModeId: parseInt(filters.workingModeId),
        });
      } else {
        queryBuilder.where("job.workingModeId = :workingModeId", {
          workingModeId: parseInt(filters.workingModeId),
        });
      }
    }

    if (filters.status) {
      if (filters.search || filters.organizationId || filters.workingModeId) {
        queryBuilder.andWhere("job.statusOpenStop = :status", { status: filters.status });
      } else {
        queryBuilder.where("job.statusOpenStop = :status", { status: filters.status });
      }
    }

    if (filters.province) {
      if (filters.search || filters.organizationId || filters.workingModeId || filters.status) {
        queryBuilder.andWhere("job.province LIKE :province", {
          province: `%${filters.province}%`,
        });
      } else {
        queryBuilder.where("job.province LIKE :province", {
          province: `%${filters.province}%`,
        });
      }
    }

    queryBuilder
      .leftJoinAndSelect("job.organization", "organization")
      .leftJoinAndSelect("job.workingMode", "workingMode")
      .leftJoinAndSelect("job.domains", "domains")
      .leftJoinAndSelect("job.requiredLanguages", "requiredLanguages")
      .leftJoinAndSelect("job.requiredCertificates", "requiredCertificates")
      .orderBy("job.createdDate", "DESC")
      .take(limit)
      .skip(offset);

    return await queryBuilder.getManyAndCount();
  }

  async findByIdWithRelations(id) {
    return await this.repository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization", "workingMode", "domains", "requiredLanguages", "requiredCertificates", "applications"],
    });
  }
}

