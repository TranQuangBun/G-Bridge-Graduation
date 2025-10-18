// Import all models
import User from "./User.js";
import InterpreterProfile from "./InterpreterProfile.js";
import ClientProfile from "./ClientProfile.js";
import Language from "./Language.js";
import Certification from "./Certification.js";

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

// Export all models
export { User, InterpreterProfile, ClientProfile, Language, Certification };

// Function to sync all models
export async function syncDatabase(force = false) {
  try {
    console.log("Syncing database models...");

    // Sync models in order (dependencies first)
    // Use alter: true to add new columns without dropping tables
    await User.sync({ force, alter: !force });
    await InterpreterProfile.sync({ force, alter: !force });
    await ClientProfile.sync({ force, alter: !force });
    await Language.sync({ force, alter: !force });
    await Certification.sync({ force, alter: !force });

    console.log("✓ Database models synced successfully!");
  } catch (error) {
    console.error("✗ Error syncing database models:", error);
    throw error;
  }
}
