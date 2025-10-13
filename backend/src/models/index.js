// Import all models
import User from "./User.js";
import InterpreterProfile from "./InterpreterProfile.js";
import ClientProfile from "./ClientProfile.js";

// Define all associations here
User.hasOne(InterpreterProfile, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
InterpreterProfile.belongsTo(User, {
  foreignKey: "userId",
});

User.hasOne(ClientProfile, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
ClientProfile.belongsTo(User, {
  foreignKey: "userId",
});

// Export all models
export { User, InterpreterProfile, ClientProfile };

// Function to sync all models
export async function syncDatabase(force = false) {
  try {
    console.log("Syncing database models...");

    // Sync models in order (dependencies first)
    await User.sync({ force });
    await InterpreterProfile.sync({ force });
    await ClientProfile.sync({ force });

    console.log("✓ Database models synced successfully!");
  } catch (error) {
    console.error("✗ Error syncing database models:", error);
    throw error;
  }
}
