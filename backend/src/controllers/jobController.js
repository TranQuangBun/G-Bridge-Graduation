import {
  Job,
  Organization,
  WorkingMode,
  Domain,
  JobHasDomain,
  JobRequiredLanguage,
  JobRequiredCertificate,
  JobApplication,
  SavedJob,
  Language,
  Level,
  Certification,
  User,
} from "../models/index.js";
import { Op } from "sequelize";

// Get all jobs with filters
export async function getJobs(req, res) {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      province = "",
      domainId = "",
      workingModeId = "",
      minSalary = "",
      maxSalary = "",
      status = "open",
      sortBy = "createdDate",
      sortOrder = "DESC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    if (province) {
      whereClause.province = province;
    }

    if (workingModeId) {
      whereClause.workingModeId = parseInt(workingModeId);
    }

    if (minSalary) {
      whereClause.minSalary = { [Op.gte]: parseFloat(minSalary) };
    }

    if (maxSalary) {
      whereClause.maxSalary = { [Op.lte]: parseFloat(maxSalary) };
    }

    if (status) {
      whereClause.statusOpenStop = status;
    }

    // Check for expired jobs and update status
    await Job.update(
      { statusOpenStop: "expired" },
      {
        where: {
          expirationDate: { [Op.lt]: new Date() },
          statusOpenStop: "open",
        },
      }
    );

    // Build include array
    const include = [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "logo", "province", "address"],
      },
      {
        model: WorkingMode,
        as: "workingMode",
        attributes: ["id", "name", "nameVi"],
      },
      {
        model: Domain,
        as: "domains",
        attributes: ["id", "name", "nameVi"],
        through: { attributes: [] },
      },
      {
        model: JobRequiredLanguage,
        as: "requiredLanguages",
        attributes: ["id", "jobId", "languageId", "levelId"],
        include: [
          {
            model: Language,
            as: "language",
            attributes: ["id", "name", "proficiencyLevel"],
          },
          {
            model: Level,
            as: "level",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: JobRequiredCertificate,
        as: "requiredCertificates",
        attributes: ["id", "jobId", "certificateId", "minAchievementDetail"],
        include: [
          {
            model: Certification,
            as: "certificate",
            attributes: ["id", "name", "issuingOrganization"],
          },
        ],
      },
    ];

    // If domainId filter is specified, we need to join through domains
    let domainFilter = {};
    if (domainId) {
      include.push({
        model: Domain,
        as: "domains",
        where: { id: parseInt(domainId) },
        attributes: [],
        through: { attributes: [] },
        required: true,
      });
    }

    // Get jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      include,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
}

// Get single job by ID
export async function getJobById(req, res) {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Organization,
          as: "organization",
          attributes: [
            "id",
            "name",
            "logo",
            "description",
            "website",
            "email",
            "phone",
            "address",
            "province",
          ],
        },
        {
          model: WorkingMode,
          as: "workingMode",
          attributes: ["id", "name", "nameVi", "description"],
        },
        {
          model: Domain,
          as: "domains",
          attributes: ["id", "name", "nameVi", "description"],
          through: { attributes: [] },
        },
        {
          model: JobRequiredLanguage,
          as: "requiredLanguages",
          include: [
            {
              model: Language,
              as: "language",
              attributes: ["id", "language"],
            },
            {
              model: Level,
              as: "level",
              attributes: ["id", "name", "description"],
            },
          ],
        },
        {
          model: JobRequiredCertificate,
          as: "requiredCertificates",
          include: [
            {
              model: Certification,
              as: "certificate",
              attributes: ["id", "name", "issuingOrganization"],
            },
          ],
        },
        {
          model: JobApplication,
          as: "applications",
          attributes: ["id", "status"],
          where: req.user
            ? { interpreterId: req.user.sub || req.user.id }
            : undefined,
          required: false,
        },
      ],
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user has saved this job
    let isSaved = false;
    if (req.user) {
      const savedJob = await SavedJob.findOne({
        where: {
          userId: req.user.sub || req.user.id,
          jobId: id,
        },
      });
      isSaved = !!savedJob;
    }

    res.json({
      success: true,
      data: {
        ...job.toJSON(),
        isSaved,
        hasApplied: job.applications && job.applications.length > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching job",
      error: error.message,
    });
  }
}

// Create new job (Admin/Organization only)
export async function createJob(req, res) {
  try {
    const {
      organizationId,
      workingModeId,
      title,
      province,
      commune,
      address,
      expirationDate,
      quantity,
      descriptions,
      responsibility,
      benefits,
      minSalary,
      maxSalary,
      salaryType,
      contactEmail,
      contactPhone,
      domains,
      requiredLanguages,
      requiredCertificates,
    } = req.body;

    // Create job
    const job = await Job.create({
      organizationId,
      workingModeId,
      title,
      province,
      commune,
      address,
      expirationDate,
      quantity,
      descriptions,
      responsibility,
      benefits,
      minSalary,
      maxSalary,
      salaryType,
      contactEmail,
      contactPhone,
      statusOpenStop: "open",
      createdDate: new Date(),
    });

    // Add domains
    if (domains && domains.length > 0) {
      const domainRecords = domains.map((domainId) => ({
        jobId: job.id,
        domainId,
      }));
      await JobHasDomain.bulkCreate(domainRecords);
    }

    // Add required languages
    if (requiredLanguages && requiredLanguages.length > 0) {
      await JobRequiredLanguage.bulkCreate(
        requiredLanguages.map((lang) => ({
          jobId: job.id,
          ...lang,
        }))
      );
    }

    // Add required certificates
    if (requiredCertificates && requiredCertificates.length > 0) {
      await JobRequiredCertificate.bulkCreate(
        requiredCertificates.map((cert) => ({
          jobId: job.id,
          ...cert,
        }))
      );
    }

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({
      success: false,
      message: "Error creating job",
      error: error.message,
    });
  }
}

// Apply for a job
export async function applyForJob(req, res) {
  try {
    const { jobId } = req.params;
    const { coverLetter, resumeUrl, resumeType } = req.body;
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field

    // Check if job exists and is open
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.statusOpenStop !== "open") {
      return res.status(400).json({
        success: false,
        message: "This job is no longer accepting applications",
      });
    }

    if (new Date() > new Date(job.expirationDate)) {
      return res.status(400).json({
        success: false,
        message: "Application deadline has passed",
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      where: {
        jobId,
        interpreterId: userId,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create application
    const application = await JobApplication.create({
      jobId,
      interpreterId: userId,
      coverLetter,
      resumeUrl,
      resumeType,
      status: "pending",
      applicationDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting application",
      error: error.message,
    });
  }
}

// Save/Unsave a job
export async function toggleSaveJob(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field

    // Check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if already saved
    const savedJob = await SavedJob.findOne({
      where: {
        userId,
        jobId,
      },
    });

    if (savedJob) {
      // Unsave
      await savedJob.destroy();
      return res.json({
        success: true,
        message: "Job removed from saved list",
        isSaved: false,
      });
    } else {
      // Save
      await SavedJob.create({
        userId,
        jobId,
        savedDate: new Date(),
      });
      return res.json({
        success: true,
        message: "Job saved successfully",
        isSaved: true,
      });
    }
  } catch (error) {
    console.error("Error toggling save job:", error);
    res.status(500).json({
      success: false,
      message: "Error saving/unsaving job",
      error: error.message,
    });
  }
}

// Get user's saved jobs
export async function getSavedJobs(req, res) {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const savedJobs = await SavedJob.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Job,
          as: "job",
          include: [
            {
              model: Organization,
              as: "organization",
              attributes: ["id", "name", "logo"],
            },
            {
              model: WorkingMode,
              as: "workingMode",
              attributes: ["id", "name", "nameVi"],
            },
            {
              model: Domain,
              as: "domains",
              attributes: ["id", "name", "nameVi"],
              through: { attributes: [] },
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["savedDate", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        savedJobs: savedJobs.rows,
        pagination: {
          total: savedJobs.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(savedJobs.count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved jobs",
      error: error.message,
    });
  }
}

// Get user's job applications
export async function getMyApplications(req, res) {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field
    const { page = 1, limit = 12, status = "" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { interpreterId: userId };
    if (status) {
      whereClause.status = status;
    }

    const applications = await JobApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: "job",
          include: [
            {
              model: Organization,
              as: "organization",
              attributes: ["id", "name", "logo"],
            },
            {
              model: WorkingMode,
              as: "workingMode",
              attributes: ["id", "name", "nameVi"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["applicationDate", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        applications: applications.rows,
        pagination: {
          total: applications.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(applications.count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
      error: error.message,
    });
  }
}

// Get working modes lookup data
export async function getWorkingModes(req, res) {
  try {
    const workingModes = await WorkingMode.findAll({
      attributes: ["id", "name", "nameVi", "description"],
      order: [["id", "ASC"]],
    });

    res.json({
      success: true,
      data: workingModes,
    });
  } catch (error) {
    console.error("Error fetching working modes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching working modes",
      error: error.message,
    });
  }
}

// Get domains lookup data
export async function getDomains(req, res) {
  try {
    const domains = await Domain.findAll({
      attributes: ["id", "name", "nameVi", "description"],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching domains",
      error: error.message,
    });
  }
}

// Get levels lookup data
export async function getLevels(req, res) {
  try {
    const levels = await Level.findAll({
      attributes: ["id", "name", "description", "order"],
      order: [["order", "ASC"]],
    });

    res.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching levels",
      error: error.message,
    });
  }
}
