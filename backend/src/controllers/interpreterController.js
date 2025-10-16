import {
  User,
  InterpreterProfile,
  Language,
  Certification,
} from "../models/index.js";
import { Op } from "sequelize";

// Get all interpreters with filters
export const getInterpreters = async (req, res) => {
  try {
    console.log("🔍 getInterpreters called with query:", req.query);

    const {
      search,
      languages,
      minRate,
      maxRate,
      minExperience,
      specializations,
      rating,
      location,
      availability,
      certifications,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    // Build where conditions
    const userWhere = {
      role: "interpreter",
      isActive: true,
    };

    const profileWhere = {};

    // Search by name or email
    if (search) {
      userWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by location
    if (location) {
      userWhere.address = { [Op.like]: `%${location}%` };
    }

    // Filter by hourly rate range
    if (minRate) {
      profileWhere.hourlyRate = { [Op.gte]: parseFloat(minRate) };
    }
    if (maxRate) {
      if (profileWhere.hourlyRate) {
        profileWhere.hourlyRate[Op.lte] = parseFloat(maxRate);
      } else {
        profileWhere.hourlyRate = { [Op.lte]: parseFloat(maxRate) };
      }
    }

    // Filter by experience
    if (minExperience) {
      profileWhere.experience = { [Op.gte]: parseInt(minExperience) };
    }

    // Filter by rating
    // Filter by rating
    if (rating) {
      profileWhere.rating = { [Op.gte]: parseFloat(rating) };
    }

    // Note: Specializations will be filtered post-query since it's a JSON field

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log("📊 Query conditions:", {
      userWhere,
      profileWhere,
      page,
      limit,
      offset,
    });

    // Query with includes
    const { count, rows: interpreters } = await User.findAndCountAll({
      where: userWhere,
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          where:
            Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          required: true, // Must have interpreter profile
        },
        {
          model: Language,
          as: "languages",
          attributes: ["id", "name", "proficiencyLevel", "yearsOfExperience"],
          required: false,
        },
        {
          model: Certification,
          as: "certifications",
          attributes: [
            "id",
            "name",
            "issuingOrganization",
            "issueDate",
            "score",
            "verificationStatus",
          ],
          where:
            certifications === "verified"
              ? { verificationStatus: "approved" }
              : undefined,
          required: false,
        },
      ],
      attributes: [
        "id",
        "fullName",
        "email",
        "phone",
        "address",
        "avatar",
        "createdAt",
      ],
      order:
        sortBy === "rating"
          ? [
              [
                { model: InterpreterProfile, as: "interpreterProfile" },
                "rating",
                sortOrder,
              ],
            ]
          : [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    console.log(
      `✅ Query returned ${interpreters.length} interpreters (total: ${count})`
    );

    // Additional filtering for languages (post-query)
    let filteredInterpreters = interpreters;
    if (languages) {
      const langArray = languages.split(",").map((l) => l.trim().toLowerCase());
      filteredInterpreters = filteredInterpreters.filter((interpreter) => {
        const interpreterLangs = interpreter.languages || [];
        return langArray.some((reqLang) =>
          interpreterLangs.some((lang) => lang.name.toLowerCase() === reqLang)
        );
      });
    }

    // Filter by specializations (post-query for JSON field)
    if (specializations) {
      const specArray = specializations
        .split(",")
        .map((s) => s.trim().toLowerCase());
      filteredInterpreters = filteredInterpreters.filter((interpreter) => {
        let specs = interpreter.interpreterProfile?.specializations;

        // Parse if string
        if (typeof specs === "string") {
          try {
            specs = JSON.parse(specs);
          } catch (e) {
            specs = [];
          }
        }

        if (!Array.isArray(specs)) return false;

        return specArray.some((reqSpec) =>
          specs.some((spec) => spec.toLowerCase().includes(reqSpec))
        );
      });
    }

    // Format response
    const formattedInterpreters = filteredInterpreters.map((interpreter) => {
      // Parse JSON fields if they are strings
      let specializations = interpreter.interpreterProfile?.specializations;
      if (typeof specializations === "string") {
        try {
          specializations = JSON.parse(specializations);
        } catch (e) {
          console.error("Error parsing specializations:", e);
          specializations = [];
        }
      }

      console.log(
        "Specializations type:",
        typeof specializations,
        "Value:",
        specializations
      );

      return {
        id: interpreter.id,
        fullName: interpreter.fullName,
        email: interpreter.email,
        phone: interpreter.phone,
        address: interpreter.address,
        avatar: interpreter.avatar,
        profile: {
          hourlyRate: interpreter.interpreterProfile?.hourlyRate,
          currency: interpreter.interpreterProfile?.currency || "USD",
          experience: interpreter.interpreterProfile?.experience,
          specializations: specializations || [],
          rating: interpreter.interpreterProfile?.rating || 0,
          completedJobs: interpreter.interpreterProfile?.completedJobs || 0,
          totalReviews: interpreter.interpreterProfile?.totalReviews || 0,
          bio: interpreter.interpreterProfile?.portfolio,
          availability: interpreter.interpreterProfile?.availability,
        },
        languages: interpreter.languages || [],
        certifications: interpreter.certifications || [],
        joinedDate: interpreter.createdAt,
      };
    });

    res.json({
      success: true,
      data: {
        interpreters: formattedInterpreters,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching interpreters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interpreters",
      error: error.message,
    });
  }
};

// Get single interpreter by ID
export const getInterpreterById = async (req, res) => {
  try {
    const { id } = req.params;

    const interpreter = await User.findOne({
      where: { id, role: "interpreter" },
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: true,
        },
        {
          model: Language,
          as: "languages",
        },
        {
          model: Certification,
          as: "certifications",
        },
      ],
      attributes: [
        "id",
        "fullName",
        "email",
        "phone",
        "address",
        "avatar",
        "createdAt",
      ],
    });

    if (!interpreter) {
      return res.status(404).json({
        success: false,
        message: "Interpreter not found",
      });
    }

    // Parse JSON fields if they are strings
    let specializations = interpreter.interpreterProfile?.specializations;
    if (typeof specializations === "string") {
      try {
        specializations = JSON.parse(specializations);
      } catch (e) {
        specializations = [];
      }
    }

    const formattedInterpreter = {
      id: interpreter.id,
      fullName: interpreter.fullName,
      email: interpreter.email,
      phone: interpreter.phone,
      address: interpreter.address,
      avatar: interpreter.avatar,
      profile: {
        hourlyRate: interpreter.interpreterProfile?.hourlyRate,
        currency: interpreter.interpreterProfile?.currency || "USD",
        experience: interpreter.interpreterProfile?.experience,
        specializations: specializations || [],
        rating: interpreter.interpreterProfile?.rating || 0,
        completedJobs: interpreter.interpreterProfile?.completedJobs || 0,
        totalReviews: interpreter.interpreterProfile?.totalReviews || 0,
        bio: interpreter.interpreterProfile?.portfolio,
        availability: interpreter.interpreterProfile?.availability,
        portfolio: interpreter.interpreterProfile?.portfolio,
      },
      languages: interpreter.languages || [],
      certifications: interpreter.certifications || [],
      joinedDate: interpreter.createdAt,
    };

    res.json({
      success: true,
      data: formattedInterpreter,
    });
  } catch (error) {
    console.error("Error fetching interpreter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interpreter details",
      error: error.message,
    });
  }
};

// Get available languages (for filter options)
export const getAvailableLanguages = async (req, res) => {
  try {
    const languages = await Language.findAll({
      attributes: ["name"],
      group: ["name"],
      raw: true,
    });

    const uniqueLanguages = [...new Set(languages.map((l) => l.name))].sort();

    res.json({
      success: true,
      data: uniqueLanguages,
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch languages",
      error: error.message,
    });
  }
};

// Get available specializations (for filter options)
export const getAvailableSpecializations = async (req, res) => {
  try {
    const profiles = await InterpreterProfile.findAll({
      attributes: ["specializations"],
      where: {
        specializations: { [Op.not]: null },
      },
    });

    const allSpecs = new Set();
    profiles.forEach((profile) => {
      let specs = profile.specializations;

      // Parse if it's a string
      if (typeof specs === "string") {
        try {
          specs = JSON.parse(specs);
        } catch (e) {
          specs = [];
        }
      }

      if (Array.isArray(specs)) {
        specs.forEach((spec) => allSpecs.add(spec));
      }
    });

    res.json({
      success: true,
      data: Array.from(allSpecs).sort(),
    });
  } catch (error) {
    console.error("Error fetching specializations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch specializations",
      error: error.message,
    });
  }
};
