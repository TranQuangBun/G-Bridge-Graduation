import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  User,
  InterpreterProfile,
  ClientProfile,
  Language,
  Certification,
  UserSubscription,
  SubscriptionPlan,
} from "../models/index.js";

const JWT_EXPIRES = "7d";

export async function register(req, res) {
  try {
    const { fullName, email, password, role, companyName, companyType } =
      req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate role
    if (!["admin", "client", "interpreter"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Additional validation for client role
    if (role === "client" && (!companyName || !companyType)) {
      return res.status(400).json({
        message: "Company name and type are required for client registration",
      });
    }

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role,
      isActive: role !== "admin", // Admins need approval
      isVerified: false,
    });

    // Create role-specific profile
    let profile = null;
    if (role === "interpreter") {
      profile = await InterpreterProfile.create({
        userId: user.id,
        languages: [],
        specializations: [],
        experience: 0,
        hourlyRate: null,
        currency: "USD",
        availability: null,
        certifications: [],
        portfolio: null,
        rating: 0.0,
        totalReviews: 0,
        completedJobs: 0,
        isAvailable: true,
        verificationStatus: "pending",
        profileCompleteness: 20, // Basic info completed
      });
    } else if (role === "client") {
      profile = await ClientProfile.create({
        userId: user.id,
        companyName,
        companyType,
        accountStatus: "pending_approval",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        isPremium: user.isPremium || false,
        premiumExpiresAt: user.premiumExpiresAt,
      },
      profile: profile
        ? {
            id: profile.id,
            ...(role === "client" && {
              companyName: profile.companyName,
              accountStatus: profile.accountStatus,
            }),
            ...(role === "interpreter" && {
              profileCompleteness: profile.profileCompleteness,
            }),
          }
        : null,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ message: "Server error during registration" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    // Find user with profile data
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: false,
        },
        {
          model: ClientProfile,
          as: "clientProfile",
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account is suspended or pending approval" });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Prepare profile data based on role
    let profileData = null;
    if (user.role === "interpreter" && user.interpreterProfile) {
      profileData = {
        id: user.interpreterProfile.id,
        languages: user.interpreterProfile.languages,
        specializations: user.interpreterProfile.specializations,
        hourlyRate: user.interpreterProfile.hourlyRate,
        rating: user.interpreterProfile.rating,
        isAvailable: user.interpreterProfile.isAvailable,
        profileCompleteness: user.interpreterProfile.profileCompleteness,
      };
    } else if (user.role === "client" && user.clientProfile) {
      profileData = {
        id: user.clientProfile.id,
        companyName: user.clientProfile.companyName,
        companyType: user.clientProfile.companyType,
        website: user.clientProfile.website,
        accountStatus: user.clientProfile.accountStatus,
        subscriptionPlan: user.clientProfile.subscriptionPlan,
      };
    }

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isPremium: user.isPremium || false,
        premiumExpiresAt: user.premiumExpiresAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile: profileData,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.sub, {
      attributes: [
        "id",
        "fullName",
        "email",
        "role",
        "phone",
        "avatar",
        "address",
        "isVerified",
        "isPremium",
        "premiumExpiresAt",
        "createdAt",
        "lastLoginAt",
      ],
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: false,
        },
        {
          model: ClientProfile,
          as: "clientProfile",
          required: false,
        },
        {
          model: Language,
          as: "languages",
          required: false,
          attributes: [
            "id",
            "name",
            "proficiencyLevel",
            "canSpeak",
            "canWrite",
            "canRead",
            "yearsOfExperience",
            "isActive",
          ],
        },
        {
          model: Certification,
          as: "certifications",
          required: false,
          attributes: [
            "id",
            "name",
            "issuingOrganization",
            "issueDate",
            "expiryDate",
            "credentialId",
            "credentialUrl",
            "score",
            "imageUrl",
            "description",
            "isVerified",
            "isActive",
          ],
        },
        {
          model: UserSubscription,
          as: "activeSubscription",
          required: false,
          where: {
            status: "active",
          },
          include: [
            {
              model: SubscriptionPlan,
              as: "plan",
              attributes: ["id", "name", "displayName", "price"],
            },
          ],
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Prepare profile data based on role
    let profileData = null;
    if (user.role === "interpreter" && user.interpreterProfile) {
      profileData = user.interpreterProfile;
    } else if (user.role === "client" && user.clientProfile) {
      profileData = user.clientProfile;
    }

    // Get subscription info
    let subscription = null;
    if (user.activeSubscription) {
      subscription = {
        planId: user.activeSubscription.planId,
        planKey: user.activeSubscription.plan?.name || "free",
        displayName: user.activeSubscription.plan?.displayName || "Free",
        price: user.activeSubscription.plan?.price || 0,
        status: user.activeSubscription.status,
        startDate: user.activeSubscription.startDate,
        endDate: user.activeSubscription.endDate,
      };
      console.log("📦 /auth/me - User has active subscription:", subscription);
    } else {
      console.log("⚠️ /auth/me - User has no active subscription");
    }

    console.log("✅ /auth/me - Returning user data with subscription");

    return res.json({
      user: user.toJSON(),
      profile: profileData,
      languages: user.languages || [],
      certifications: user.certifications || [],
      subscription: subscription,
    });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update user basic info (fullName, phone, address, avatar)
export async function updateUserProfile(req, res) {
  try {
    const { fullName, phone, address, avatar } = req.body;
    const userId = req.user.sub;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    console.error("Update user profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update interpreter profile
export async function updateInterpreterProfile(req, res) {
  try {
    const userId = req.user.sub;

    // Check if user is interpreter
    const user = await User.findByPk(userId);
    if (!user || user.role !== "interpreter") {
      return res
        .status(403)
        .json({ message: "Only interpreters can update interpreter profile" });
    }

    const {
      languages,
      specializations,
      experience,
      hourlyRate,
      currency,
      certifications,
      portfolio,
      isAvailable,
    } = req.body;

    let profile = await InterpreterProfile.findOne({ where: { userId } });

    if (!profile) {
      // Create profile if doesn't exist
      profile = await InterpreterProfile.create({
        userId,
        languages: languages || [],
        specializations: specializations || [],
        experience: experience || 0,
        hourlyRate: hourlyRate || null,
        currency: currency || "USD",
        certifications: certifications || [],
        portfolio: portfolio || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      });
    } else {
      // Update fields if provided
      if (languages !== undefined) profile.languages = languages;
      if (specializations !== undefined)
        profile.specializations = specializations;
      if (experience !== undefined) profile.experience = experience;
      if (hourlyRate !== undefined) profile.hourlyRate = hourlyRate;
      if (currency !== undefined) profile.currency = currency;
      if (certifications !== undefined) profile.certifications = certifications;
      if (portfolio !== undefined) profile.portfolio = portfolio;
      if (isAvailable !== undefined) profile.isAvailable = isAvailable;

      await profile.save();
    }

    // Calculate profile completeness
    const completeness = calculateProfileCompleteness(user, profile);
    profile.profileCompleteness = completeness;
    await profile.save();

    return res.json({
      message: "Interpreter profile updated successfully",
      profile: profile.toJSON(),
    });
  } catch (err) {
    console.error("Update interpreter profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user, profile) {
  let completeness = 0;
  const fields = [
    user.fullName,
    user.phone,
    user.address,
    profile.languages?.length > 0,
    profile.certifications?.length > 0,
    profile.specializations?.length > 0,
    profile.experience > 0,
    profile.hourlyRate,
    profile.portfolio,
  ];

  fields.forEach((field) => {
    if (field) completeness += 11.11; // 9 fields = ~100%
  });

  return Math.round(completeness);
}

// Upload avatar
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get userId from JWT payload (sub field)
    const userId = req.user.sub || req.user.id;

    // Tạo URL cho avatar (relative path)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Cập nhật avatar trong database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Xóa avatar cũ nếu có (trên server)
    if (user.avatar && user.avatar.startsWith("/uploads/")) {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const oldAvatarPath = path.join(__dirname, "../../", user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = avatarUrl;
    await user.save();

    return res.json({
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Upload avatar error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
