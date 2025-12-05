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

  it('timezone conversions', () => {
    jest.setSystemTime(new Date('2024-01-15T09:30:00Z').getTime())

    const result = calculateSecondsFromTransition(['10:00'], 'Europe/Paris')

    // 09:30 UTC -> 10:30 Paris is 30 minutes after 10:00
    expect(result).toBe(1800)
  })
})
