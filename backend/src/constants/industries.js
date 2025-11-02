// Industry sectors for company profiles
export const INDUSTRIES = [
  { value: "technology", label: "Technology & IT" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "education", label: "Education & Training" },
  { value: "finance", label: "Finance & Banking" },
  { value: "legal", label: "Legal Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "real_estate", label: "Real Estate" },
  { value: "construction", label: "Construction" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "media", label: "Media & Entertainment" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "agriculture", label: "Agriculture" },
  { value: "pharmaceutical", label: "Pharmaceutical" },
  { value: "consulting", label: "Consulting Services" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "nonprofit", label: "Non-profit Organization" },
  { value: "government", label: "Government & Public Sector" },
  { value: "other", label: "Other" },
];

export const COMPANY_SIZES = [
  { value: "under_10", label: "Under 10 employees" },
  { value: "10-50", label: "10-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "101-200", label: "101-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

export const VERIFICATION_STATUS = {
  UNVERIFIED: "unverified", // Chưa upload giấy tờ
  PENDING: "pending", // Đã upload, chờ admin duyệt
  VERIFIED: "verified", // Admin đã duyệt
  REJECTED: "rejected", // Admin từ chối
};
