import { CertificationRepository } from "../repositories/CertificationRepository.js";
import { NotFoundError } from "../utils/Errors.js";
import { updateProfileCompleteness } from "../utils/ProfileCompleteness.js";

export class CertificationService {
  constructor() {
    this.certificationRepository = new CertificationRepository();
  }

  async getAllCertifications(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
      userId = "",
      verificationStatus = "",
      isActive = "",
    } = filters;

    const queryBuilder = this.certificationRepository.repository
      .createQueryBuilder("certification")
      .leftJoinAndSelect("certification.user", "user")
      .select([
        "certification.id",
        "certification.name",
        "certification.issuingOrganization",
        "certification.issueDate",
        "certification.expiryDate",
        "certification.credentialId",
        "certification.credentialUrl",
        "certification.score",
        "certification.imageUrl",
        "certification.description",
        "certification.verificationStatus",
        "certification.isVerified",
        "certification.isActive",
        "certification.createdAt",
        "user.id",
        "user.fullName",
        "user.email",
      ]);

    if (search) {
      queryBuilder.where(
        "(certification.name LIKE :search OR certification.issuingOrganization LIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (userId) {
      queryBuilder.andWhere("certification.userId = :userId", { userId: parseInt(userId) });
    }

    if (verificationStatus) {
      queryBuilder.andWhere("certification.verificationStatus = :verificationStatus", { verificationStatus });
    }

    if (isActive !== "") {
      queryBuilder.andWhere("certification.isActive = :isActive", { isActive: isActive === "true" });
    }

    queryBuilder.orderBy("certification.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [certifications, count] = await queryBuilder.getManyAndCount();

    return {
      certifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  async getCertificationById(id) {
    const certification = await this.certificationRepository.repository.findOne({
      where: { id: parseInt(id) },
      relations: ["user"],
      select: {
        id: true,
        name: true,
        issuingOrganization: true,
        issueDate: true,
        expiryDate: true,
        credentialId: true,
        credentialUrl: true,
        score: true,
        imageUrl: true,
        description: true,
        verificationStatus: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        user: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    return certification;
  }

  async createCertification(data) {
    const certification = this.certificationRepository.repository.create(data);
    const saved = await this.certificationRepository.repository.save(certification);
    
    // Update profile completeness if user is interpreter
    if (data.userId) {
      await updateProfileCompleteness(data.userId);
    }
    
    return saved;
  }

  async updateCertification(id, data) {
    const certification = await this.certificationRepository.repository.findOne({
      where: { id: parseInt(id) },
    });

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    const userId = certification.userId;
    Object.assign(certification, data);
    const saved = await this.certificationRepository.repository.save(certification);
    
    // Update profile completeness if user is interpreter
    if (userId) {
      await updateProfileCompleteness(userId);
    }
    
    return saved;
  }

  async deleteCertification(id) {
    const certification = await this.certificationRepository.repository.findOne({
      where: { id: parseInt(id) },
    });

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    const userId = certification.userId;
    await this.certificationRepository.repository.remove(certification);
    
    // Update profile completeness if user is interpreter
    if (userId) {
      await updateProfileCompleteness(userId);
    }
    
    return true;
  }

  async updateCertificationImage(userId, certificationId, imageUrl) {
    const certification = await this.certificationRepository.repository.findOne({
      where: { id: parseInt(certificationId), userId: parseInt(userId) },
    });

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    certification.imageUrl = imageUrl;
    certification.verificationStatus = "pending";
    return await this.certificationRepository.repository.save(certification);
  }
}

