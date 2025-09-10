// Example of how fixtures can be shared between unit and integration tests
import {
  expectedFtseData,
  expectedRussellData,
  ftseCsvFixture,
  russellCsvFixture,
} from '../fixtures'

describe('Integration Tests', () => {
  // These tests would demonstrate how the same fixtures
  // can be used for end-to-end testing scenarios

  it('should have access to FTSE fixture data', () => {
    expect(ftseCsvFixture).toBeDefined()
    expect(ftseCsvFixture).toContain('FTSE 100 Index')
    expect(expectedFtseData.indexCode).toBe('UKX')
  })

  it('should have access to Russell fixture data', () => {
    expect(russellCsvFixture).toBeDefined()
    expect(russellCsvFixture).toContain('Russell 1000')
    expect(expectedRussellData.close).toBe(3547.4)
  })
})
