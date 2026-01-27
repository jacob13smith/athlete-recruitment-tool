import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Formats a phone number with hyphens
 * Examples:
 * - "5551234567" -> "555-123-4567"
 * - "(555) 123-4567" -> "555-123-4567"
 * - "555-123-4567" -> "555-123-4567" (already formatted)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ""
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")
  
  // Format based on length
  if (digits.length === 10) {
    // US/Canada format: 555-123-4567
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  } else if (digits.length === 11 && digits[0] === "1") {
    // US/Canada with country code: 1-555-123-4567
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  } else if (digits.length > 0) {
    // For other lengths, try to format reasonably
    // Format as XXX-XXX-XXXX if possible, otherwise return as-is with some formatting
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    }
  }
  
  // If we can't format it, return the original
  return phone
}
