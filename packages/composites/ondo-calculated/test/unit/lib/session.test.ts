import { calculateSecondsFromTransition } from '../../../src/lib/session'

describe('calculateSecondsFromTransition', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('before session', () => {
    jest.setSystemTime(new Date('2024-01-15T12:30:00Z').getTime())

    const result = calculateSecondsFromTransition(['10:00', '14:00', '16:00'], 'UTC')

    // 12:30 is 90 minutes (5400 seconds) before 14:00
    expect(result).toBe(-5400)
  })

  it('after session', () => {
    jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

    const result = calculateSecondsFromTransition(['10:00', '14:00'], 'UTC')

    // 10:30 is 30 minutes (1800 seconds) after 10:00
    expect(result).toBe(1800)
  })

  it('close to session', () => {
    jest.setSystemTime(new Date('2024-01-15T10:00:05.5Z').getTime())

    const result = calculateSecondsFromTransition(['10:00', '14:00'], 'UTC')

    // 10:00:05.5 is 5.5 seconds after 10:00
    expect(result).toBe(5.5)
  })

  it('at session', () => {
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z').getTime())

    const result = calculateSecondsFromTransition(['10:00', '14:00'], 'UTC')

    expect(result).toBe(0)
  })

  it('mid night - before', () => {
    jest.setSystemTime(new Date('2024-01-15T23:58:00Z').getTime())

    const result = calculateSecondsFromTransition(['00:02'], 'UTC')

    expect(result).toBe(-240)
  })

  it('mid night - after', () => {
    jest.setSystemTime(new Date('2024-01-15T00:02:00Z').getTime())

    const result = calculateSecondsFromTransition(['23:58'], 'UTC')

    expect(result).toBe(240)
  })

  it('timezone conversions', () => {
    jest.setSystemTime(new Date('2024-01-15T09:30:00Z').getTime())

    const result = calculateSecondsFromTransition(['10:00'], 'Europe/Paris')

    // 09:30 UTC -> 10:30 Paris is 30 minutes after 10:00
    expect(result).toBe(1800)
  })

  it('skips Sunday 4AM', () => {
    // Sunday 4:05 AM UTC
    jest.setSystemTime(new Date('2024-01-07T04:05:00Z').getTime())

    const result = calculateSecondsFromTransition(['04:00', '16:00', '20:00'], 'UTC')

    // Sunday 4:05 AM is 8 hours and 5 minutes (29100 seconds) after Saturday 20:00
    expect(result).toBe(29100)
  })

  it('does not skip non-Sunday 4AM', () => {
    // Friday 4:05 AM UTC
    jest.setSystemTime(new Date('2024-01-05T04:05:00Z').getTime())

    const result = calculateSecondsFromTransition(['04:00', '16:00', '20:00'], 'UTC')

    // Unlike Sunday 4AM, Friday 4AM should not be skipped
    expect(result).toBe(300)
  })
})
