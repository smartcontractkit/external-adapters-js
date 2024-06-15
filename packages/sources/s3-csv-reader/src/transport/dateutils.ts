import { format, subDays } from 'date-fns'

export function getFormattedDateStrings(
  lookbackDays: number,
  startingDate: number = Date.now(),
): string[] {
  const formattedDates = []
  for (let i = 0; i < lookbackDays; i++) {
    const formattedDate = format(subDays(startingDate, i), 'dd-MM-yyyy')
    formattedDates.push(formattedDate)
  }
  return formattedDates
}
