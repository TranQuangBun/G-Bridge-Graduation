import { LanguageRepository } from "../repositories/LanguageRepository.js";
import { NotFoundError } from "../utils/Errors.js";
import { updateProfileCompleteness } from "../utils/ProfileCompleteness.js";

export class LanguageService {
  constructor() {
    this.languageRepository = new LanguageRepository();
  }

  async getAllLanguages(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
      userId = "",
      proficiencyLevel = "",
      isActive = "",
    } = filters;

    const queryBuilder = this.languageRepository.repository
      .createQueryBuilder("language")
      .leftJoinAndSelect("language.user", "user")
      .select([
        "language.id",
        "language.name",
        "language.proficiencyLevel",
        "language.canSpeak",
        "language.canWrite",
        "language.canRead",
        "language.yearsOfExperience",
        "language.isActive",
        "language.createdAt",
        "user.id",
        "user.fullName",
        "user.email",
      ]);

    if (search) {
      queryBuilder.where("language.name LIKE :search", { search: `%${search}%` });
    }

    if (userId) {
      queryBuilder.andWhere("language.userId = :userId", { userId: parseInt(userId) });
    }

    if (proficiencyLevel) {
      queryBuilder.andWhere("language.proficiencyLevel = :proficiencyLevel", { proficiencyLevel });
    }

    if (isActive !== "") {
      queryBuilder.andWhere("language.isActive = :isActive", { isActive: isActive === "true" });
    }

    queryBuilder.orderBy("language.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [languages, count] = await queryBuilder.getManyAndCount();

    return {
      languages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  async getLanguageById(id) {
    const language = await this.languageRepository.repository.findOne({
      where: { id: parseInt(id) },
      relations: ["user"],
      select: {
        id: true,
        name: true,
        proficiencyLevel: true,
        canSpeak: true,
        canWrite: true,
        canRead: true,
        yearsOfExperience: true,
        isActive: true,
        createdAt: true,
        user: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });

    if (!language) {
      throw new NotFoundError("Language");
    }

    return language;
  }

  async createLanguage(data) {
    const language = this.languageRepository.repository.create(data);
    const saved = await this.languageRepository.repository.save(language);
    
    // Update profile completeness if user is interpreter
    if (data.userId) {
      await updateProfileCompleteness(data.userId);
    }
    
    return saved;
  }

  async updateLanguage(id, data) {
    const language = await this.languageRepository.repository.findOne({
      where: { id: parseInt(id) },
    });

    if (!language) {
      throw new NotFoundError("Language");
    }

    const userId = language.userId;
    Object.assign(language, data);
    const saved = await this.languageRepository.repository.save(language);
    
    // Update profile completeness if user is interpreter
    if (userId) {
      await updateProfileCompleteness(userId);
    }
    
    return saved;
  }

  async deleteLanguage(id) {
    const language = await this.languageRepository.repository.findOne({
      where: { id: parseInt(id) },
    });

    if (!language) {
      throw new NotFoundError("Language");
    }

    const userId = language.userId;
    await this.languageRepository.repository.remove(language);
    
    // Update profile completeness if user is interpreter
    if (userId) {
      await updateProfileCompleteness(userId);
    }
    
    return true;
  }
}

