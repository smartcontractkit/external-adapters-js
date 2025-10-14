import { RussellDailyValuesParser } from '../../../src/parsing/russell'
import { expectedRussellData, russellCsvFixture } from '../../fixtures'

describe('RussellDailyValuesParser', () => {
  let parser: RussellDailyValuesParser

  beforeEach(() => {
    parser = new RussellDailyValuesParser('Russell 1000® Index')
  })

  describe('parse', () => {
    it('should parse the actual Russell CSV file correctly', async () => {
      const { parsedData, result } = await parser.parse(russellCsvFixture)
      expect(parsedData).toEqual(expectedRussellData)
      expect(result).toBe(expectedRussellData.close)
    })

    it('should throw error for invalid CSV format', async () => {
      const invalidContent = 'Invalid CSV content without proper headers'

      await expect(parser.parse(invalidContent)).rejects.toThrow(
        'CSV content does not have enough lines to validate header row at line 6',
      )
    })

    it('should throw error when Index Name header is not found', async () => {
      const invalidContent = `Wrong Header,Some Column
Russell 1000® Index,Some Value`

      await expect(parser.parse(invalidContent)).rejects.toThrow(
        'CSV content does not have enough lines to validate header row at line 6',
      )
    })

    it('should throw error when null values are found in required columns', async () => {
      const csvWithNullValues = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 1000® Index,3538.25,3550.79,3534.60,,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28`

      await expect(parser.parse(csvWithNullValues)).rejects.toThrow(
        'Empty values found in required columns: Close',
      )
    })

    it('should throw error when no Russell 1000® Index records are found', async () => {
      const csvWithoutRussell = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 2000® Index,1234.56,1245.67,1230.45,1240.00,5.44,0.44,1245.67,1200.00,30.00,2.50,1245.67,1000.00,240.00,24.00`

      await expect(parser.parse(csvWithoutRussell)).rejects.toThrow(
        'No matching Russell index records found',
      )
    })

    it('should throw error when multiple Russell 1000® Index records are found', async () => {
      const csvWithDuplicateRussell = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 1000® Index,3538.25,3550.79,3534.60,3547.40,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28
Russell 1000® Index,3538.25,3550.79,3534.60,3547.50,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28`

      await expect(parser.parse(csvWithDuplicateRussell)).rejects.toThrow(
        'Multiple matching Russell index records found, expected only one',
      )
    })

    it('should handle CSV with random XXXXXXXX on last row due to relax_column_count setting', async () => {
      // Test CSV with inconsistent column count on last row - this mimics the random "XXXXXXXX" element
      const csvWithInconsistentColumns = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 1000® Index,3538.25,3550.79,3534.60,3547.40,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28
Russell 2000® Index,1234.56,1245.67,1230.45,1240.00,5.44,0.44
XXXXXXXX`

      const { parsedData } = await parser.parse(csvWithInconsistentColumns)
      expect(parsedData.indexName).toBe('Russell 1000® Index')
      expect(parsedData.close).toBe(3547.4)
    })
  })
})
