import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, InterpreterProfile, ClientProfile } from "../models/index.js";

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
          required: false,
        },
        {
          model: ClientProfile,
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
    if (user.role === "interpreter" && user.InterpreterProfile) {
      profileData = {
        id: user.InterpreterProfile.id,
        languages: user.InterpreterProfile.languages,
        specializations: user.InterpreterProfile.specializations,
        hourlyRate: user.InterpreterProfile.hourlyRate,
        rating: user.InterpreterProfile.rating,
        isAvailable: user.InterpreterProfile.isAvailable,
        profileCompleteness: user.InterpreterProfile.profileCompleteness,
      };
    } else if (user.role === "client" && user.ClientProfile) {
      profileData = {
        id: user.ClientProfile.id,
        companyName: user.ClientProfile.companyName,
        companyType: user.ClientProfile.companyType,
        website: user.ClientProfile.website,
        accountStatus: user.ClientProfile.accountStatus,
        subscriptionPlan: user.ClientProfile.subscriptionPlan,
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
        "isVerified",
        "createdAt",
        "lastLoginAt",
      ],
      include: [
        {
          model: InterpreterProfile,
          required: false,
        },
        {
          model: ClientProfile,
          required: false,
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Prepare profile data based on role
    let profileData = null;
    if (user.role === "interpreter" && user.InterpreterProfile) {
      profileData = user.InterpreterProfile;
    } else if (user.role === "client" && user.ClientProfile) {
      profileData = user.ClientProfile;
    }

    return res.json({
      user: user.toJSON(),
      profile: profileData,
    });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
