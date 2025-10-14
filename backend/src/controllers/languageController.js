import { Language } from "../models/index.js";

// Get all languages for current user
export async function getMyLanguages(req, res) {
  try {
    const userId = req.user.sub || req.user.id;

    const languages = await Language.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      languages,
      total: languages.length,
    });
  } catch (err) {
    console.error("Get languages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Add new language
export async function addLanguage(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const {
      name,
      proficiencyLevel,
      canSpeak,
      canWrite,
      canRead,
      yearsOfExperience,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Language name is required" });
    }

    // Check if language already exists for this user
    const existing = await Language.findOne({
      where: { userId, name },
    });

    if (existing) {
      return res.status(409).json({
        message: "This language already exists in your profile",
      });
    }

    const language = await Language.create({
      userId,
      name,
      proficiencyLevel: proficiencyLevel || "Intermediate",
      canSpeak: canSpeak !== undefined ? canSpeak : true,
      canWrite: canWrite !== undefined ? canWrite : true,
      canRead: canRead !== undefined ? canRead : true,
      yearsOfExperience: yearsOfExperience || 0,
    });

    return res.status(201).json({
      message: "Language added successfully",
      language,
    });
  } catch (err) {
    console.error("Add language error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update language
export async function updateLanguage(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;
    const {
      name,
      proficiencyLevel,
      canSpeak,
      canWrite,
      canRead,
      yearsOfExperience,
      isActive,
    } = req.body;

    const language = await Language.findOne({
      where: { id, userId },
    });

    if (!language) {
      return res.status(404).json({ message: "Language not found" });
    }

    // Update fields
    if (name !== undefined) language.name = name;
    if (proficiencyLevel !== undefined)
      language.proficiencyLevel = proficiencyLevel;
    if (canSpeak !== undefined) language.canSpeak = canSpeak;
    if (canWrite !== undefined) language.canWrite = canWrite;
    if (canRead !== undefined) language.canRead = canRead;
    if (yearsOfExperience !== undefined)
      language.yearsOfExperience = yearsOfExperience;
    if (isActive !== undefined) language.isActive = isActive;

    await language.save();

    return res.json({
      message: "Language updated successfully",
      language,
    });
  } catch (err) {
    console.error("Update language error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete language
export async function deleteLanguage(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;

    const language = await Language.findOne({
      where: { id, userId },
    });

    if (!language) {
      return res.status(404).json({ message: "Language not found" });
    }

    await language.destroy();

    return res.json({
      message: "Language deleted successfully",
    });
  } catch (err) {
    console.error("Delete language error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
