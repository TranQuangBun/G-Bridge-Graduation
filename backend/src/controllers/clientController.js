import ClientProfile from "../models/ClientProfile.js";
import User from "../models/User.js";
import { VERIFICATION_STATUS } from "../constants/industries.js";

// Get client profile
export const getClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone", "address", "avatar"],
        },
      ],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching client profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client profile",
      error: error.message,
    });
  }
};

// Update client profile
export const updateClientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      companyName,
      companyType,
      companySize,
      website,
      industry,
      description,
      businessLicenseNumber,
      headquarters,
      foundedYear,
    } = req.body;

    let profile = await ClientProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Update profile fields
    const updateData = {
      ...(companyName && { companyName }),
      ...(companyType && { companyType }),
      ...(companySize && { companySize }),
      ...(website && { website }),
      ...(industry && { industry }),
      ...(description && { description }),
      ...(businessLicenseNumber && { businessLicenseNumber }),
      ...(headquarters && { headquarters }),
      ...(foundedYear && { foundedYear }),
    };

    await profile.update(updateData);

    // Reload with user data
    profile = await ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone", "address", "avatar"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error updating client profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update client profile",
      error: error.message,
    });
  }
};

// Upload business license
export const uploadBusinessLicense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessLicenseUrl, businessLicenseNumber } = req.body;

    if (!businessLicenseUrl) {
      return res.status(400).json({
        success: false,
        message: "Business license image is required",
      });
    }

    let profile = await ClientProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Check if basic info is complete
    if (!profile.companyName || !profile.industry || !profile.companySize) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete company basic information (name, industry, size) before uploading business license",
      });
    }

    // Update business license and set status to pending
    await profile.update({
      businessLicense: businessLicenseUrl,
      businessLicenseNumber:
        businessLicenseNumber || profile.businessLicenseNumber,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      accountStatus: "pending_approval",
    });

    // Reload with user data
    profile = await ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone", "address", "avatar"],
        },
      ],
    });

    res.json({
      success: true,
      message:
        "Business license uploaded successfully. Your profile is now pending admin verification.",
      data: profile,
    });
  } catch (error) {
    console.error("Error uploading business license:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload business license",
      error: error.message,
    });
  }
};

// Upload company logo
export const uploadLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        message: "Logo image is required",
      });
    }

    let profile = await ClientProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    // Update logo
    await profile.update({
      logo: logoUrl,
    });

    // Reload with user data
    profile = await ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone", "address", "avatar"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Company logo uploaded successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload logo",
      error: error.message,
    });
  }
};

// Check if profile is complete (for requiring verification)
export const checkProfileCompleteness = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await ClientProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    const isBasicInfoComplete = !!(
      profile.companyName &&
      profile.industry &&
      profile.companySize &&
      profile.description
    );

    const hasBusinessLicense = !!profile.businessLicense;

    const isVerified =
      profile.verificationStatus === VERIFICATION_STATUS.VERIFIED;

    const canPostJobs =
      isBasicInfoComplete &&
      hasBusinessLicense &&
      (profile.verificationStatus === VERIFICATION_STATUS.VERIFIED ||
        profile.verificationStatus === VERIFICATION_STATUS.PENDING);

    res.json({
      success: true,
      data: {
        isBasicInfoComplete,
        hasBusinessLicense,
        isVerified,
        canPostJobs,
        verificationStatus: profile.verificationStatus,
        missingFields: {
          companyName: !profile.companyName,
          industry: !profile.industry,
          companySize: !profile.companySize,
          description: !profile.description,
          businessLicense: !profile.businessLicense,
        },
      },
    });
  } catch (error) {
    console.error("Error checking profile completeness:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check profile completeness",
      error: error.message,
    });
  }
};

// Get verification badge info
export const getVerificationBadge = async (req, res) => {
  try {
    const { companyId } = req.params;

    const profile = await ClientProfile.findByPk(companyId, {
      attributes: [
        "id",
        "companyName",
        "verificationStatus",
        "businessLicenseVerified",
        "verifiedAt",
      ],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const isVerified =
      profile.verificationStatus === VERIFICATION_STATUS.VERIFIED;

    res.json({
      success: true,
      data: {
        companyId: profile.id,
        companyName: profile.companyName,
        isVerified,
        verifiedAt: profile.verifiedAt,
        badgeText: isVerified ? "Verified Company" : null,
      },
    });
  } catch (error) {
    console.error("Error getting verification badge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get verification badge",
      error: error.message,
    });
  }
};
