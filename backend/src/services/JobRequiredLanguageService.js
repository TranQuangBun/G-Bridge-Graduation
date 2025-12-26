import { JobRequiredLanguageRepository } from "../repositories/JobRequiredLanguageRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Job } from "../entities/Job.js";
import { Language } from "../entities/Language.js";
import { Level } from "../entities/Level.js";

export class JobRequiredLanguageService {
  constructor() {
    this.jobRequiredLanguageRepository = new JobRequiredLanguageRepository();
    this.jobRepository = AppDataSource.getRepository(Job);
    this.languageRepository = AppDataSource.getRepository(Language);
    this.levelRepository = AppDataSource.getRepository(Level);
  }

  async getAllJobRequiredLanguages(query) {
    const {
      page = 1,
      limit = 20,
      jobId = "",
      languageId = "",
      levelId = "",
    } = query;

    if (jobId) {
      const languages = await this.jobRequiredLanguageRepository.findByJobId(
        jobId,
        { relations: ["language", "level"] }
      );
      return {
        languages,
        pagination: {
          total: languages.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(languages.length / parseInt(limit)),
        },
      };
    }

    if (languageId) {
      const languages = await this.jobRequiredLanguageRepository.findByLanguageId(
        languageId,
        { relations: ["job", "level"] }
      );
      return {
        languages,
        pagination: {
          total: languages.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(languages.length / parseInt(limit)),
        },
      };
    }

    if (levelId) {
      const languages = await this.jobRequiredLanguageRepository.findByLevelId(
        levelId,
        { relations: ["job", "language"] }
      );
      return {
        languages,
        pagination: {
          total: languages.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(languages.length / parseInt(limit)),
        },
      };
    }

    const [languages, total] =
      await this.jobRequiredLanguageRepository.findAndCount({
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        relations: ["job", "language", "level"],
      });

    return {
      languages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getJobRequiredLanguageById(id) {
    const language = await this.jobRequiredLanguageRepository.findById(
      parseInt(id),
      { relations: ["job", "language", "level"] }
    );
    if (!language) {
      throw new Error("Job required language not found");
    }
    return language;
  }

  async createJobRequiredLanguage(data) {
    const { jobId, languageId, levelId, isSourceLanguage } = data;

    if (!jobId || !languageId || !levelId) {
      throw new Error("jobId, languageId, and levelId are required");
    }

    // Verify job, language, and level exist
    const job = await this.jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });
    const language = await this.languageRepository.findOne({
      where: { id: parseInt(languageId) },
    });
    const level = await this.levelRepository.findOne({
      where: { id: parseInt(levelId) },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (!language) {
      throw new Error("Language not found");
    }

    if (!level) {
      throw new Error("Level not found");
    }

    // Check if already exists
    const existing = await this.jobRequiredLanguageRepository.findOne({
      jobId: parseInt(jobId),
      languageId: parseInt(languageId),
    });

    if (existing) {
      throw new Error("Job required language already exists");
    }

    const jobRequiredLanguage = await this.jobRequiredLanguageRepository.create(
      {
        jobId: parseInt(jobId),
        languageId: parseInt(languageId),
        levelId: parseInt(levelId),
        isSourceLanguage: isSourceLanguage || false,
      }
    );

    return await this.jobRequiredLanguageRepository.findById(
      jobRequiredLanguage.id,
      { relations: ["job", "language", "level"] }
    );
  }

  async updateJobRequiredLanguage(id, data) {
    const language = await this.jobRequiredLanguageRepository.findById(
      parseInt(id)
    );
    if (!language) {
      throw new Error("Job required language not found");
    }

    // Verify related entities if provided
    if (data.languageId) {
      const lang = await this.languageRepository.findOne({
        where: { id: parseInt(data.languageId) },
      });
      if (!lang) {
        throw new Error("Language not found");
      }
    }

    if (data.levelId) {
      const level = await this.levelRepository.findOne({
        where: { id: parseInt(data.levelId) },
      });
      if (!level) {
        throw new Error("Level not found");
      }
    }

    await this.jobRequiredLanguageRepository.update(parseInt(id), data);
    return await this.jobRequiredLanguageRepository.findById(parseInt(id), {
      relations: ["job", "language", "level"],
    });
  }

  async deleteJobRequiredLanguage(id) {
    const deleted = await this.jobRequiredLanguageRepository.delete(
      parseInt(id)
    );
    if (!deleted) {
      throw new Error("Job required language not found");
    }
    return true;
  }

  async deleteByJobId(jobId) {
    return await this.jobRequiredLanguageRepository.deleteByJobId(jobId);
  }
}

