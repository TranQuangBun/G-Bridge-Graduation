// Industry sectors for company profiles
export const INDUSTRIES = [
  {
    value: "technology",
    label: { en: "Technology & IT", vi: "Công nghệ & CNTT" },
  },
  {
    value: "healthcare",
    label: { en: "Healthcare & Medical", vi: "Y tế & Sức khỏe" },
  },
  {
    value: "education",
    label: { en: "Education & Training", vi: "Giáo dục & Đào tạo" },
  },
  {
    value: "finance",
    label: { en: "Finance & Banking", vi: "Tài chính & Ngân hàng" },
  },
  { value: "legal", label: { en: "Legal Services", vi: "Dịch vụ Pháp lý" } },
  { value: "manufacturing", label: { en: "Manufacturing", vi: "Sản xuất" } },
  {
    value: "retail",
    label: { en: "Retail & E-commerce", vi: "Bán lẻ & Thương mại điện tử" },
  },
  {
    value: "hospitality",
    label: { en: "Hospitality & Tourism", vi: "Khách sạn & Du lịch" },
  },
  { value: "real_estate", label: { en: "Real Estate", vi: "Bất động sản" } },
  { value: "construction", label: { en: "Construction", vi: "Xây dựng" } },
  {
    value: "transportation",
    label: { en: "Transportation & Logistics", vi: "Vận tải & Logistics" },
  },
  {
    value: "media",
    label: { en: "Media & Entertainment", vi: "Truyền thông & Giải trí" },
  },
  {
    value: "telecommunications",
    label: { en: "Telecommunications", vi: "Viễn thông" },
  },
  {
    value: "energy",
    label: { en: "Energy & Utilities", vi: "Năng lượng & Tiện ích" },
  },
  { value: "agriculture", label: { en: "Agriculture", vi: "Nông nghiệp" } },
  { value: "pharmaceutical", label: { en: "Pharmaceutical", vi: "Dược phẩm" } },
  {
    value: "consulting",
    label: { en: "Consulting Services", vi: "Dịch vụ Tư vấn" },
  },
  {
    value: "marketing",
    label: { en: "Marketing & Advertising", vi: "Marketing & Quảng cáo" },
  },
  {
    value: "nonprofit",
    label: { en: "Non-profit Organization", vi: "Tổ chức phi lợi nhuận" },
  },
  {
    value: "government",
    label: { en: "Government & Public Sector", vi: "Chính phủ & Khu vực công" },
  },
  { value: "other", label: { en: "Other", vi: "Khác" } },
];

export const COMPANY_SIZES = [
  {
    value: "under_10",
    label: { en: "Under 10 employees", vi: "Dưới 10 nhân viên" },
  },
  { value: "10-50", label: { en: "10-50 employees", vi: "10-50 nhân viên" } },
  {
    value: "51-100",
    label: { en: "51-100 employees", vi: "51-100 nhân viên" },
  },
  {
    value: "101-200",
    label: { en: "101-200 employees", vi: "101-200 nhân viên" },
  },
  {
    value: "201-500",
    label: { en: "201-500 employees", vi: "201-500 nhân viên" },
  },
  { value: "500+", label: { en: "500+ employees", vi: "Trên 500 nhân viên" } },
];

export const VERIFICATION_STATUS = {
  UNVERIFIED: "unverified", // Chưa upload giấy tờ
  PENDING: "pending", // Đã upload, chờ admin duyệt
  VERIFIED: "verified", // Admin đã duyệt
  REJECTED: "rejected", // Admin từ chối
};

export const COMPANY_TYPES = [
  { value: "startup", label: { en: "Startup", vi: "Công ty khởi nghiệp" } },
  { value: "corporation", label: { en: "Corporation", vi: "Tập đoàn" } },
  { value: "nonprofit", label: { en: "Non-profit", vi: "Phi lợi nhuận" } },
  { value: "government", label: { en: "Government", vi: "Cơ quan nhà nước" } },
  { value: "healthcare", label: { en: "Healthcare", vi: "Y tế" } },
  { value: "education", label: { en: "Education", vi: "Giáo dục" } },
  { value: "other", label: { en: "Other", vi: "Khác" } },
];
