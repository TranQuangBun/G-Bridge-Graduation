// Import all models
import User from "./User.js";
import InterpreterProfile from "./InterpreterProfile.js";
import ClientProfile from "./ClientProfile.js";
import Language from "./Language.js";
import Certification from "./Certification.js";

// Import Job-related models
import Organization from "./Organization.js";
import WorkingMode from "./WorkingMode.js";
import Domain from "./Domain.js";
import Level from "./Level.js";
import Job from "./Job.js";
import JobHasDomain from "./JobHasDomain.js";
import JobRequiredLanguage from "./JobRequiredLanguage.js";
import JobRequiredCertificate from "./JobRequiredCertificate.js";
import JobApplication from "./JobApplication.js";
import SavedJob from "./SavedJob.js";

// Define all associations here
User.hasOne(InterpreterProfile, {
  foreignKey: "userId",
  as: "interpreterProfile",
  onDelete: "CASCADE",
});
InterpreterProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasOne(ClientProfile, {
  foreignKey: "userId",
  as: "clientProfile",
  onDelete: "CASCADE",
});
ClientProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User has many Languages
User.hasMany(Language, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "languages",
});
Language.belongsTo(User, {
  foreignKey: "userId",
});

// User has many Certifications
User.hasMany(Certification, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "certifications",
});
Certification.belongsTo(User, {
  foreignKey: "userId",
});

// ==================== JOB RELATIONSHIPS ====================

// Organization has many Jobs
Organization.hasMany(Job, {
  foreignKey: "organizationId",
  as: "jobs",
  onDelete: "CASCADE",
});
Job.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

// WorkingMode has many Jobs
WorkingMode.hasMany(Job, {
  foreignKey: "workingModeId",
  as: "jobs",
  onDelete: "RESTRICT",
});
Job.belongsTo(WorkingMode, {
  foreignKey: "workingModeId",
  as: "workingMode",
});

// Job and Domain (Many-to-Many through JobHasDomain)
Job.belongsToMany(Domain, {
  through: JobHasDomain,
  foreignKey: "jobId",
  otherKey: "domainId",
  as: "domains",
});
Domain.belongsToMany(Job, {
  through: JobHasDomain,
  foreignKey: "domainId",
  otherKey: "jobId",
  as: "jobs",
});

// Job has many JobRequiredLanguages
Job.hasMany(JobRequiredLanguage, {
  foreignKey: "jobId",
  as: "requiredLanguages",
  onDelete: "CASCADE",
});
JobRequiredLanguage.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});

// Language has many JobRequiredLanguages
Language.hasMany(JobRequiredLanguage, {
  foreignKey: "languageId",
  as: "jobRequirements",
  onDelete: "CASCADE",
});
JobRequiredLanguage.belongsTo(Language, {
  foreignKey: "languageId",
  as: "language",
});

// Level has many JobRequiredLanguages
Level.hasMany(JobRequiredLanguage, {
  foreignKey: "levelId",
  as: "jobRequirements",
  onDelete: "RESTRICT",
});
JobRequiredLanguage.belongsTo(Level, {
  foreignKey: "levelId",
  as: "level",
});

// Job has many JobRequiredCertificates
Job.hasMany(JobRequiredCertificate, {
  foreignKey: "jobId",
  as: "requiredCertificates",
  onDelete: "CASCADE",
});
JobRequiredCertificate.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});

// Certification has many JobRequiredCertificates
Certification.hasMany(JobRequiredCertificate, {
  foreignKey: "certificateId",
  as: "jobRequirements",
  onDelete: "CASCADE",
});
JobRequiredCertificate.belongsTo(Certification, {
  foreignKey: "certificateId",
  as: "certificate",
});

// Job has many JobApplications
Job.hasMany(JobApplication, {
  foreignKey: "jobId",
  as: "applications",
  onDelete: "CASCADE",
});
JobApplication.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});

// User (Interpreter) has many JobApplications
User.hasMany(JobApplication, {
  foreignKey: "interpreterId",
  as: "jobApplications",
  onDelete: "CASCADE",
});
JobApplication.belongsTo(User, {
  foreignKey: "interpreterId",
  as: "interpreter",
});

// User and Job (Many-to-Many through SavedJob)
User.belongsToMany(Job, {
  through: SavedJob,
  foreignKey: "userId",
  otherKey: "jobId",
  as: "savedJobs",
});
Job.belongsToMany(User, {
  through: SavedJob,
  foreignKey: "jobId",
  otherKey: "userId",
  as: "savedByUsers",
});

// SavedJob direct associations (for querying saved jobs with job details)
SavedJob.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});
Job.hasMany(SavedJob, {
  foreignKey: "jobId",
  as: "savedBy",
});

SavedJob.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});
User.hasMany(SavedJob, {
  foreignKey: "userId",
  as: "savedJobRecords",
});

// Export all models
export {
  User,
  InterpreterProfile,
  ClientProfile,
  Language,
  Certification,
  Organization,
  WorkingMode,
  Domain,
  Level,
  Job,
  JobHasDomain,
  JobRequiredLanguage,
  JobRequiredCertificate,
  JobApplication,
  SavedJob,
};

// Function to sync all models
export async function syncDatabase(force = false) {
  try {
    console.log("Syncing database models...");

    // Sync models in order (dependencies first)
    // Temporarily disabled alter to avoid MySQL key limit issues
    // Re-enable alter when schema changes are needed

    // Core models
    await User.sync({ force });
    await InterpreterProfile.sync({ force });
    await ClientProfile.sync({ force });
    await Language.sync({ force });
    await Certification.sync({ force });

    // Job-related lookup tables
    await Organization.sync({ force });
    await WorkingMode.sync({ force });
    await Domain.sync({ force });
    await Level.sync({ force });

    // Main Job table
    await Job.sync({ force });

    // Job relationship tables
    await JobHasDomain.sync({ force });
    await JobRequiredLanguage.sync({ force });
    await JobRequiredCertificate.sync({ force });
    await JobApplication.sync({ force });
    await SavedJob.sync({ force });

    console.log("✓ Database models synced successfully!");
  } catch (error) {
    console.error("✗ Error syncing database models:", error);
    throw error;
  }
}
