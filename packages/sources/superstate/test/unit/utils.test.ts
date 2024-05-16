import { getStartingAndEndingDates } from '../../src/endpoint/price'

describe('getStartingAndEndingDates', () => {
  it('should return dates with defaults', () => {
    const mockToday = new Date('2001-01-01T11:11:11.111Z')
    jest.useFakeTimers('modern')
    jest.setSystemTime(mockToday)
    const { startDate, endDate } = getStartingAndEndingDates()
    expect(endDate).toBe('2001-01-01')
    expect(startDate).toBe('2000-12-26')
    jest.useRealTimers()
  })

  it('should return dates with provided reference date', () => {
    const mockDate = new Date('2001-04-24T11:11:11.111Z')
    const { startDate, endDate } = getStartingAndEndingDates(undefined, mockDate)
    expect(endDate).toBe('2001-04-24')
    expect(startDate).toBe('2001-04-18')
  })

  it('should return dates with provided time window', () => {
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    const { startDate, endDate } = getStartingAndEndingDates(34, mockDate)
    expect(endDate).toBe('2001-01-01')
    expect(startDate).toBe('2000-11-29')
  })
})
