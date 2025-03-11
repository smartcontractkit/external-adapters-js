export const extractDate = (timeString: string) => {
  const hours = parseInt(timeString.substring(0, 2), 10) // Extract HH
  const minutes = parseInt(timeString.substring(2, 4), 10) // Extract mm

  const now = new Date() // Get current date
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes),
  )

  return utcDate
}
