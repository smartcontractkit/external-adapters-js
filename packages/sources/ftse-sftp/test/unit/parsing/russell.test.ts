import { RussellDailyValuesParser } from '../../../src/parsing/russell'
import { russellCsvFixture, expectedRussellData } from './fixtures'

describe('RussellDailyValuesParser', () => {
  let parser: RussellDailyValuesParser

  beforeEach(() => {
    parser = new RussellDailyValuesParser('Russell 1000� Index')
  })

  describe('parse', () => {
    it('should parse the actual Russell CSV file correctly', async () => {
      const result = await parser.parse(russellCsvFixture)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expectedRussellData)
    })

    it('should throw error for invalid CSV format', async () => {
      const invalidContent = 'Invalid CSV content without proper headers'

      await expect(parser.parse(invalidContent)).rejects.toThrow(
        'No matching Russell index records found',
      )
    })

    it('should throw error when Index Name header is not found', async () => {
      const invalidContent = `Wrong Header,Some Column
Russell 1000® Index,Some Value`

      await expect(parser.parse(invalidContent)).rejects.toThrow(
        'No matching Russell index records found',
      )
    })

    it('should handle null values correctly', async () => {
      const csvWithNullValues = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 1000� Index,3538.25,3550.79,3534.60,,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28`

      const result = await parser.parse(csvWithNullValues)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        indexName: 'Russell 1000� Index',
        close: null,
      })
    })

    it('should throw error when multiple Russell 1000® Index records are found', async () => {
      const csvWithDuplicateRussell = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 1000� Index,3538.25,3550.79,3534.60,3547.40,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28
Russell 1000� Index,3538.25,3550.79,3534.60,3547.50,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28`

      await expect(parser.parse(csvWithDuplicateRussell)).rejects.toThrow(
        'Multiple matching Russell index records found, expected only one',
      )
    })
  })
})
