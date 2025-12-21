import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository.js";

export async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Load user from database to check isActive status
    const userRepository = new UserRepository();
    const user = await userRepository.findById(payload.sub);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact support." 
      });
    }
    
    req.user = payload;
    req.userData = user; // Store full user data for convenience
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Role-based authorization middleware
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
}

// Middleware to check if user can access their own resources or admin can access all
export function requireOwnershipOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const userId = req.params.userId || req.params.id;
  const isOwner = req.user.sub === parseInt(userId);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      message: "Access denied. You can only access your own resources.",
    });
  }

  next();
}

// Middleware for admin-only routes
export const adminOnly = requireRole("admin");

// Middleware for client-only routes
export const clientOnly = requireRole("client");

// Middleware for interpreter-only routes
export const interpreterOnly = requireRole("interpreter");

// Middleware for both client and interpreter (not admin)
export const userOnly = requireRole("client", "interpreter");

// Middleware for all authenticated users
export const authenticatedOnly = authRequired;
