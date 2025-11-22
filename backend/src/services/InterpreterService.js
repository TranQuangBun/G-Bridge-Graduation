import { InterpreterProfileRepository } from "../repositories/InterpreterProfileRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { LanguageRepository } from "../repositories/LanguageRepository.js";
import { CertificationRepository } from "../repositories/CertificationRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { InterpreterProfile } from "../entities/InterpreterProfile.js";
import { Language } from "../entities/Language.js";
import { Certification } from "../entities/Certification.js";
import { NotFoundError } from "../utils/Errors.js";

export class InterpreterService {
  constructor() {
    this.interpreterProfileRepository = new InterpreterProfileRepository();
    this.userRepository = new UserRepository();
    this.languageRepository = new LanguageRepository();
    this.certificationRepository = new CertificationRepository();
  }

  async getInterpretersWithFilters(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
      languages = "",
      specializations = "",
      verificationStatus = "",
      isAvailable = "",
      minRating = "",
      province = "",
    } = filters;

    const queryBuilder = AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.interpreterProfile", "profile")
      .leftJoinAndSelect("user.languages", "languages")
      .leftJoinAndSelect("user.certifications", "certifications")
      .where("user.role = :role", { role: "interpreter" })
      .andWhere("user.isActive = :isActive", { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        "(user.fullName LIKE :search OR user.email LIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (verificationStatus) {
      queryBuilder.andWhere("profile.verificationStatus = :verificationStatus", {
        verificationStatus,
      });
    }

    if (isAvailable !== "") {
      queryBuilder.andWhere("profile.isAvailable = :isAvailable", {
        isAvailable: isAvailable === "true",
      });
    }

    if (minRating) {
      queryBuilder.andWhere("profile.rating >= :minRating", {
        minRating: parseFloat(minRating),
      });
    }

    if (province) {
      queryBuilder.andWhere("profile.province = :province", { province });
    }

    if (languages) {
      const languageIds = languages.split(",").map((id) => parseInt(id));
      queryBuilder.andWhere("languages.id IN (:...languageIds)", { languageIds });
    }

    queryBuilder
      .orderBy("profile.rating", "DESC")
      .addOrderBy("user.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [interpreters, count] = await queryBuilder.getManyAndCount();

    return {
      interpreters,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  async getInterpreterById(id) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: parseInt(id), role: "interpreter" },
      relations: [
        "interpreterProfile",
        "languages",
        "certifications",
      ],
    });

    if (!user || !user.interpreterProfile) {
      throw new NotFoundError("Interpreter");
    }

    return user;
  }

  async getAvailableLanguagesForFilter() {
    const languages = await AppDataSource.getRepository(Language)
      .createQueryBuilder("language")
      .select("DISTINCT language.name", "name")
      .addSelect("language.id", "id")
      .orderBy("language.name", "ASC")
      .getRawMany();

    return languages;
  }

  async getAvailableSpecializationsForFilter() {
    const specializations = await AppDataSource.getRepository(Certification)
      .createQueryBuilder("certification")
      .select("DISTINCT certification.name", "name")
      .addSelect("certification.id", "id")
      .where("certification.isActive = :isActive", { isActive: true })
      .orderBy("certification.name", "ASC")
      .getRawMany();

    return specializations;
  }
}

const interpreterService = new InterpreterService();

export async function getInterpretersWithFilters(filters) {
  return await interpreterService.getInterpretersWithFilters(filters);
}

export async function getInterpreterById(id) {
  return await interpreterService.getInterpreterById(id);
}

export async function getAvailableLanguagesForFilter() {
  return await interpreterService.getAvailableLanguagesForFilter();
}

export async function getAvailableSpecializationsForFilter() {
  return await interpreterService.getAvailableSpecializationsForFilter();
}

