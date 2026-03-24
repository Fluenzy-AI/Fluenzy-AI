/**
 * Shared job-related constants used across the application
 * Centralizes work modes, locations, employment types, and their labels
 */

// Work modes / location types
export const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

// Major Indian cities
export const CITIES = [
  "Delhi",
  "Bangalore",
  "Mumbai",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Noida",
  "Gurugram",
] as const;
export type City = (typeof CITIES)[number];

// Combined locations (work modes + cities)
export const LOCATIONS = [...WORK_MODES, ...CITIES] as const;
export type Location = (typeof LOCATIONS)[number];

// Employment types
export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

// Common job roles for auto-apply preferences
export const COMMON_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Data Analyst",
  "Data Scientist",
  "AI / ML Engineer",
  "DevOps / Cloud Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Android Developer",
  "iOS Developer",
  "Embedded Systems Engineer",
  "Cybersecurity Analyst",
  "QA Engineer",
] as const;

// Display labels for location types
export const LOC_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

// Display labels for employment types
export const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

// Color classes for location badges
export const LOC_COLORS: Record<string, string> = {
  REMOTE: "bg-green-500/10 text-green-400 border-green-500/20",
  HYBRID: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ONSITE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

// Color classes for employment type badges
export const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  PART_TIME: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CONTRACT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  INTERNSHIP: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

// Experience ranges for dropdowns
export const EXPERIENCE_RANGES = [
  { value: "0-1", label: "0-1 years" },
  { value: "1-2", label: "1-2 years" },
  { value: "3-4", label: "3-4 years" },
  { value: "5+", label: "5+ years" },
] as const;

// Posted within filter options
export const POSTED_WITHIN_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

/**
 * Helper to get city label - returns the city name if not in LOC_LABELS
 */
export function getCityLabel(location: string): string {
  return LOC_LABELS[location] ?? location;
}

/**
 * Helper to get employment type label
 */
export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

/**
 * Helper to check if a location is a work mode (not a city)
 */
export function isWorkMode(location: string): location is WorkMode {
  return WORK_MODES.includes(location as WorkMode);
}
