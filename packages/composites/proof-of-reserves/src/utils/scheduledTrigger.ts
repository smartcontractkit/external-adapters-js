export const extractDate = (timeString: string) => {
  const hours = parseInt(timeString.substring(0, 2), 10) // Extract HH
  const minutes = parseInt(timeString.substring(2, 4), 10) // Extract mm

  const now = new Date() // Get current date
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes),
  )

  return utcDate
}

export const scheduleDailyFunction = (scheduledTrigger: string, callback: () => void) => {
  function setNextExecution() {
    const now = new Date()
    const targetTime = extractDate(scheduledTrigger)

    if (now >= targetTime) {
      targetTime.setUTCDate(targetTime.getUTCDate() + 1) // Move to next day
    }

    const delay = targetTime.getTime() - now.getTime()
    console.log(`Next execution in ${delay / 1000 / 60} minutes.`)

    setTimeout(() => {
      callback()
      setNextExecution() // Schedule next execution
    }, delay)
  }

  setNextExecution()
}
