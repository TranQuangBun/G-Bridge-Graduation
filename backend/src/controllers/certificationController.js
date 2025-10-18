import { Certification } from "../models/index.js";

// Get all certifications for current user
export async function getMyCertifications(req, res) {
  try {
    const userId = req.user.sub || req.user.id;

    const certifications = await Certification.findAll({
      where: { userId },
      order: [
        ["issueDate", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.json({
      certifications,
      total: certifications.length,
    });
  } catch (err) {
    console.error("Get certifications error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Add new certification
export async function addCertification(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const {
      name,
      issuingOrganization,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      score,
      description,
    } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Certification name is required" });
    }

    const certification = await Certification.create({
      userId,
      name,
      issuingOrganization,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      score,
      description,
      imageUrl: null, // Will be updated via upload endpoint
      verificationStatus: "draft", // Default status before image upload
    });

    return res.status(201).json({
      message: "Certification added successfully",
      certification,
    });
  } catch (err) {
    console.error("Add certification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update certification
export async function updateCertification(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;
    const {
      name,
      issuingOrganization,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      score,
      description,
      isActive,
    } = req.body;

    const certification = await Certification.findOne({
      where: { id, userId },
    });

    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }

    // Update fields
    if (name !== undefined) certification.name = name;
    if (issuingOrganization !== undefined)
      certification.issuingOrganization = issuingOrganization;
    if (issueDate !== undefined) certification.issueDate = issueDate;
    if (expiryDate !== undefined) certification.expiryDate = expiryDate;
    if (credentialId !== undefined) certification.credentialId = credentialId;
    if (credentialUrl !== undefined)
      certification.credentialUrl = credentialUrl;
    if (score !== undefined) certification.score = score;
    if (description !== undefined) certification.description = description;
    if (isActive !== undefined) certification.isActive = isActive;

    await certification.save();

    return res.json({
      message: "Certification updated successfully",
      certification,
    });
  } catch (err) {
    console.error("Update certification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Upload certification image
export async function uploadCertificationImage(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const certification = await Certification.findOne({
      where: { id, userId },
    });

    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }

    // Delete old image if exists
    if (
      certification.imageUrl &&
      certification.imageUrl.startsWith("/uploads/")
    ) {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const oldImagePath = path.join(
        __dirname,
        "../../",
        certification.imageUrl
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update with new image URL
    const imageUrl = `/uploads/certifications/${req.file.filename}`;
    certification.imageUrl = imageUrl;
    certification.verificationStatus = "pending"; // Set to pending after image upload
    await certification.save();

    return res.json({
      message:
        "Certification image uploaded successfully. Status changed to pending admin approval.",
      imageUrl,
      certification,
    });
  } catch (err) {
    console.error("Upload certification image error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete certification
export async function deleteCertification(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;

    const certification = await Certification.findOne({
      where: { id, userId },
    });

    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }

    // Delete image file if exists
    if (
      certification.imageUrl &&
      certification.imageUrl.startsWith("/uploads/")
    ) {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const imagePath = path.join(__dirname, "../../", certification.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await certification.destroy();

    return res.json({
      message: "Certification deleted successfully",
    });
  } catch (err) {
    console.error("Delete certification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
