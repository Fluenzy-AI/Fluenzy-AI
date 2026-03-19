/**
 * Certificate Utilities
 * Helper functions for certificate management
 */

/**
 * Generate unique certificate number
 * Format: FLUENZY-{TYPE}-{YEAR}-{RANDOM}
 * Example: FLUENZY-INT-2026-AX92K
 */
export function generateCertificateNumber(
  type: "INTERNSHIP" | "EXPERIENCE" | "OFFER" | "RELIEVING" | "APPRECIATION" | "TRAINING"
): string {
  const typeCode: Record<string, string> = {
    INTERNSHIP: "INT",
    EXPERIENCE: "EXP",
    OFFER: "OFF",
    RELIEVING: "REL",
    APPRECIATION: "APR",
    TRAINING: "TRN",
  };
  
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `FLUENZY-${typeCode[type]}-${year}-${random}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Calculate duration between two dates in human-readable format
 */
export function calculateDuration(startDate: Date, endDate: Date): string {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
}

/**
 * Validate certificate data before generation
 */
export function validateCertificateData(type: string, data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.candidateName) errors.push("Candidate name is required");
  
  switch (type) {
    case "INTERNSHIP":
    case "EXPERIENCE":
      if (!data.startDate) errors.push("Start date is required");
      if (!data.endDate) errors.push("End date is required");
      if (!data.position) errors.push("Position is required");
      break;
    case "OFFER":
      if (!data.position) errors.push("Position is required");
      if (!data.joiningDate) errors.push("Joining date is required");
      if (!data.salary) errors.push("Salary is required");
      break;
    case "RELIEVING":
      if (!data.endDate) errors.push("Last working date is required");
      if (!data.position) errors.push("Position is required");
      break;
    case "TRAINING":
      if (!data.trainingName) errors.push("Training name is required");
      if (!data.startDate) errors.push("Training start date is required");
      if (!data.endDate) errors.push("Training end date is required");
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get certificate type display name
 */
export function getCertificateTypeName(type: string): string {
  const names: Record<string, string> = {
    INTERNSHIP: "Internship Certificate",
    EXPERIENCE: "Experience Letter",
    OFFER: "Offer Letter",
    RELIEVING: "Relieving Letter",
    APPRECIATION: "Appreciation Certificate",
    TRAINING: "Training Completion Certificate",
  };
  return names[type] || type;
}

/**
 * Get certificate status badge color
 */
export function getCertificateStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-slate-400/10 text-slate-400",
    ISSUED: "bg-green-400/10 text-green-400",
    REVOKED: "bg-red-400/10 text-red-400",
  };
  return colors[status] || "bg-slate-400/10 text-slate-400";
}
