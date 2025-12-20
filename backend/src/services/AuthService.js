import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository.js";
import { InterpreterProfileRepository } from "../repositories/InterpreterProfileRepository.js";
import { ClientProfileRepository } from "../repositories/ClientProfileRepository.js";
import { AppError, NotFoundError } from "../utils/Errors.js";
import { updateProfileCompleteness } from "../utils/ProfileCompleteness.js";

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.interpreterProfileRepository = new InterpreterProfileRepository();
    this.clientProfileRepository = new ClientProfileRepository();
  }

  async registerUser(userData) {
    const { email, password, fullName, role, phone, address, isVerified } =
      userData;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Email already exists", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      fullName,
      role: role || "interpreter",
      phone,
      address,
      isActive: true,
      isVerified: isVerified !== undefined ? isVerified : false,
    });

    if (role === "interpreter") {
      await this.interpreterProfileRepository.create({
        userId: user.id,
        languages: [],
        verificationStatus: "pending",
        isAvailable: true,
      });

      // Calculate initial profile completeness
      await updateProfileCompleteness(user.id);
    } else if (role === "client") {
      await this.clientProfileRepository.create({
        userId: user.id,
        companyName: fullName,
        verificationStatus: "pending",
        accountStatus: "pending_approval",
      });
    }

    const token = this.generateToken(user);

    // Get full user data with profiles, languages, certifications (same as /auth/me)
    const fullUserData = await this.userRepository.findByIdWithProfiles(
      user.id
    );

    const userResponse = { ...fullUserData };
    delete userResponse.passwordHash;

    // Extract profile, languages, certifications for easier frontend access
    const profile =
      userResponse.interpreterProfile || userResponse.clientProfile || null;
    const languages = userResponse.languages || [];
    const certifications = userResponse.certifications || [];

    return {
      user: userResponse,
      token,
      profile,
      languages,
      certifications,
    };
  }

  async loginUser(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    const token = this.generateToken(user);

    // Get full user data with profiles, languages, certifications (same as /auth/me)
    const fullUserData = await this.userRepository.findByIdWithProfiles(
      user.id
    );

    const userResponse = { ...fullUserData };
    delete userResponse.passwordHash;

    // Extract profile, languages, certifications for easier frontend access
    const profile =
      userResponse.interpreterProfile || userResponse.clientProfile || null;
    const languages = userResponse.languages || [];
    const certifications = userResponse.certifications || [];

    return {
      user: userResponse,
      token,
      profile,
      languages,
      certifications,
    };
  }

  generateToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
  }
}

const authService = new AuthService();

export async function registerUser(userData) {
  return await authService.registerUser(userData);
}

export async function loginUser(email, password) {
  return await authService.loginUser(email, password);
}

export async function getUserByEmail(email) {
  const userRepository = new UserRepository();
  return await userRepository.findByEmail(email);
}

export async function updateUserResetToken(userId, token, expiry) {
  const userRepository = new UserRepository();
  return await userRepository.update(userId, {
    resetPasswordToken: token,
    resetPasswordExpiry: expiry,
  });
}

export async function getUserByResetToken(token) {
  const userRepository = new UserRepository();
  const users = await userRepository.findAll();
  const user = users.find(
    (u) =>
      u.resetPasswordToken === token &&
      u.resetPasswordExpiry &&
      new Date(u.resetPasswordExpiry) > new Date()
  );
  return user || null;
}

export async function updateUserPassword(userId, newPassword) {
  const userRepository = new UserRepository();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  return await userRepository.update(userId, {
    passwordHash,
  });
}

export async function clearUserResetToken(userId) {
  const userRepository = new UserRepository();
  return await userRepository.update(userId, {
    resetPasswordToken: null,
    resetPasswordExpiry: null,
  });
}
