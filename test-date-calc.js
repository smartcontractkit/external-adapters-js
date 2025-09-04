// Simple test to see what dates the adapter calculates
function calculateTargetDate() {
  // Get current date in London time
  const now = new Date()
  const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))

  // Check if it's before 4 PM London time (16:00)
  const isBeforeFileGeneration = londonTime.getHours() < 16

  // Start with current London date, but go back one day if before 4 PM
  const targetDate = new Date(londonTime)
  if (isBeforeFileGeneration) {
    targetDate.setDate(londonTime.getDate() - 1)
  }

  // Get the day of the week for the target date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = targetDate.getDay()

  // If target date falls on Saturday (6) or Sunday (0), fall back to Friday's date
  if (dayOfWeek === 0) {
    // Sunday
    targetDate.setDate(targetDate.getDate() - 2) // Go back 2 days to Friday
  } else if (dayOfWeek === 6) {
    // Saturday
    targetDate.setDate(targetDate.getDate() - 1) // Go back 1 day to Friday
  }

  // Format day, month, and year with leading zeros
  const currentDay = targetDate.getDate().toString().padStart(2, '0')
  const currentMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0') // getMonth() returns 0-11
  const currentYear = targetDate.getFullYear().toString().slice(-2) // Get last 2 digits of year

  console.log('Current time:', now.toISOString())
  console.log('London time:', londonTime.toISOString())
  console.log('Target date:', targetDate.toISOString())
  console.log('Day of week:', dayOfWeek)
  console.log('Is before 4PM:', isBeforeFileGeneration)
  console.log('Date parts:', { currentDay, currentMonth, currentYear })

  // Build file names
  const ftseFile = `ukallv${currentDay}${currentMonth}.csv`
  const russellFile = `daily_values_russell_${currentYear}${currentMonth}${currentDay}.CSV`

  console.log('FTSE file:', ftseFile)
  console.log('Russell file:', russellFile)

  return {
    ftse: `/data/valuation/uk_all_share/${ftseFile}`,
    russell: `/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/${russellFile}`,
  }
}

calculateTargetDate()
