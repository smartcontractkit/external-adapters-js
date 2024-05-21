// 1 day + 30 mins in ms
// +30m to account for expected delays between returned time field and posted time.
const LAST_UPDATE_ALLOWANCE_MS = 88_200_000

// Tenor must be between -1 and 1
export const tenorInRange = (tenor: number): boolean => tenor >= -1 && tenor <= 1
// Check if time of latest update is in the current day in UTC time
export const latestUpdateIsWithinLast24h = (utcTimeOfUpdate: number): boolean => {
  try {
    const latestUpdateDate = new Date(utcTimeOfUpdate)
    const currentDay = new Date()
    const timeDiff = currentDay.getTime() - latestUpdateDate.getTime()
    return LAST_UPDATE_ALLOWANCE_MS > timeDiff
  } catch (error) {
    return false
  }
}
