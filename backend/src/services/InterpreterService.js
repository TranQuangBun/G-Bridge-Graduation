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
      rating = "",
      minRate = "",
      maxRate = "",
      minExperience = "",
      location = "",
      province = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = filters;

    const queryBuilder = AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.interpreterProfile", "profile")
      .leftJoinAndSelect("user.languages", "languages")
      .leftJoinAndSelect("user.certifications", "certifications")
      .where("user.role = :role", { role: "interpreter" })
      .andWhere("user.isActive = :isActive", { isActive: true })
      .andWhere("profile.id IS NOT NULL"); // Ensure profile exists

    if (search) {
      queryBuilder.andWhere(
        "(user.fullName LIKE :search OR user.email LIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (verificationStatus) {
      queryBuilder.andWhere(
        "profile.verificationStatus = :verificationStatus",
        {
          verificationStatus,
        }
      );
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

    if (rating) {
      queryBuilder.andWhere("profile.rating >= :rating", {
        rating: parseFloat(rating),
      });
    }

    if (minRate) {
      queryBuilder.andWhere("profile.hourlyRate >= :minRate", {
        minRate: parseFloat(minRate),
      });
    }

    if (maxRate) {
      queryBuilder.andWhere("profile.hourlyRate <= :maxRate", {
        maxRate: parseFloat(maxRate),
      });
    }

    if (minExperience) {
      queryBuilder.andWhere("profile.experience >= :minExperience", {
        minExperience: parseInt(minExperience),
      });
    }

    if (location) {
      queryBuilder.andWhere(
        "(profile.province LIKE :location OR profile.city LIKE :location OR profile.address LIKE :location)",
        { location: `%${location}%` }
      );
    }

    if (province) {
      queryBuilder.andWhere("profile.province = :province", { province });
    }

    if (languages) {
      // Support both language names and IDs
      const languageList = languages.split(",").map((l) => l.trim());

      // Check if first item is a number (ID) or string (name)
      const isNumeric = !isNaN(parseInt(languageList[0]));

      if (isNumeric) {
        const languageIds = languageList.map((id) => parseInt(id));
        queryBuilder.andWhere("languages.id IN (:...languageIds)", {
          languageIds,
        });
      } else {
        // Filter by language names
        queryBuilder.andWhere("languages.name IN (:...languageNames)", {
          languageNames: languageList,
        });
      }
    }

    // Dynamic sorting
    const validSortFields = {
      createdAt: "user.createdAt",
      rating: "profile.rating",
      hourlyRate: "profile.hourlyRate",
      experience: "profile.experience",
      totalReviews: "profile.totalReviews",
    };

    const sortField = validSortFields[sortBy] || validSortFields.createdAt;
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    queryBuilder
      .orderBy(sortField, order)
      .addOrderBy("user.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [interpreters, count] = await queryBuilder.getManyAndCount();

    // Debug log
    console.log("📊 Interpreters found:", interpreters.length);
    if (interpreters.length > 0) {
      console.log("📝 First interpreter profile:", {
        name: interpreters[0].fullName,
        hasProfile: !!interpreters[0].interpreterProfile,
        rating: interpreters[0].interpreterProfile?.rating,
        totalReviews: interpreters[0].interpreterProfile?.totalReviews,
      });
    }

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
      relations: ["interpreterProfile", "languages", "certifications"],
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
