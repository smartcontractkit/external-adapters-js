export const extractDate = (timeString: string) => {
  validateTimeFormat(timeString)

  const hours = parseInt(timeString.substring(0, 2), 10) // Extract HH
  const minutes = parseInt(timeString.substring(2, 4), 10) // Extract mm

  const now = new Date() // Get current date
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes),
  )

  return utcDate
}

const validateTimeFormat = (timeString: string) => {
  // Ensure the string is exactly 4 digits
  if (!/^\d{4}$/.test(timeString)) {
    throw new Error('Invalid format: Time must be a 4-digit string (HHMM).')
  }

  const hours = parseInt(timeString.substring(0, 2), 10)
  const minutes = parseInt(timeString.substring(2, 4), 10)

  // Validate HH (00-23) and MM (00-59)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time: Must be in HHMM format (0000-2359).')
  }

  return true
}
