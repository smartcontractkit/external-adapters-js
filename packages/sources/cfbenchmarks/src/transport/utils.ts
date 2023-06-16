// Tenor must be between -1 and 1
export const tenorInRange = (tenor: number): boolean => tenor >= -1 && tenor <= 1
// Check if time of latest update is in the current day in UTC time
export const latestUpdateIsCurrentDay = (utcTimeOfUpdate: number): boolean => {
  try {
    const latestUpdateDate = new Date(utcTimeOfUpdate)
    const currentDay = new Date()
    return (
      latestUpdateDate.getUTCFullYear() === currentDay.getUTCFullYear() &&
      latestUpdateDate.getUTCMonth() === currentDay.getUTCMonth() &&
      latestUpdateDate.getUTCDate() === currentDay.getUTCDate()
    )
  } catch (error) {
    return false
  }
}
