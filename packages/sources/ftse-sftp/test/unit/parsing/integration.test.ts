import { FTSE100Parser } from '../../../src/parsing/ftse100'
import { RussellDailyValuesParser } from '../../../src/parsing/russell'

// Helper functions to create test data with actual tab separators
const createFTSETestData = (dataRows: string[]): string => {
  const header =
    'Index Code\tIndex/Sector Name\tNumber of Constituents\tIndex Base Currency\tUSD Index\tGBP Index\tEUR Index\tJPY Index\tAUD Index\tCNY Index\tHKD Index\tCAD Index\tLOC Index\tBase Currency (GBP) Index'
  const preamble = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

${header}`

  if (dataRows.length === 0) {
    return preamble
  }

  return preamble + '\n' + dataRows.join('\n')
}

const createRussellTestData = (dataRows: string[]): string => {
  const preamble = `Russell Daily Values for August 26, 2025
Currency: USD`

  if (dataRows.length === 0) {
    return preamble
  }

  return preamble + '\n\n' + dataRows.join('\n')
}

describe('CSV Parsers Integration', () => {
  describe('FTSE100Parser and RussellDailyValuesParser', () => {
    it('should handle different CSV formats independently', async () => {
      const ftseParser = new FTSE100Parser()
      const russellParser = new RussellDailyValuesParser()

      // Sample FTSE data
      const ftseContent = createFTSETestData([
        'UKX\tFTSE 100 Index\t100\tGBP\t4659.89484111\t5017.24846324\t4523.90007694\t2963.46786723\t6470.75900926\t10384.47293100\t4667.43880552\t5177.36970414\t\t5017.24846324',
      ])

      // Sample Russell data
      const russellContent = createRussellTestData([
        'Russell 1000® Index\t1234.56\t1250.00\t1220.00\t1245.50\t10.94\t0.88\t1280.00\t1200.00\t45.50\t3.79\t1300.00\t1100.00\t145.50\t13.25',
      ])

      // Parse both formats
      const ftseResult = await ftseParser.parse(ftseContent)
      const russellResult = await russellParser.parse(russellContent)

      // Verify FTSE results
      expect(ftseResult).toHaveLength(1)
      expect(ftseResult[0].indexCode).toBe('UKX')
      expect(ftseResult[0].gbpIndex).toBe(5017.24846324)

      // Verify Russell results
      expect(russellResult).toHaveLength(1)
      expect(russellResult[0].indexName).toBe('Russell 1000® Index')
      expect(russellResult[0].close).toBe(1245.5)

      // Verify they don't interfere with each other
      expect(ftseResult[0]).not.toHaveProperty('close')
      expect(russellResult[0]).not.toHaveProperty('indexCode')
    })

    it('should reject wrong format for each parser', async () => {
      const ftseParser = new FTSE100Parser()
      const russellParser = new RussellDailyValuesParser()

      // Try to parse Russell data with FTSE parser
      const russellContent = createRussellTestData([
        'Russell 1000® Index\t1234.56\t1250.00\t1220.00\t1245.50',
      ])

      // Try to parse FTSE data with Russell parser
      const ftseContent = createFTSETestData(['UKX\tFTSE 100 Index\t5017.25'])

      // FTSE parser should reject Russell format
      await expect(ftseParser.parse(russellContent)).rejects.toThrow()

      // Russell parser should reject FTSE format
      await expect(russellParser.parse(ftseContent)).rejects.toThrow()
    })

    it('should handle empty or invalid data gracefully', async () => {
      const ftseParser = new FTSE100Parser()
      const russellParser = new RussellDailyValuesParser()

      const emptyContent = ''
      const invalidContent = 'Invalid CSV data without proper structure'

      // Both parsers should handle empty content
      expect(ftseParser.validateFormat(emptyContent)).toBe(false)
      expect(russellParser.validateFormat(emptyContent)).toBe(false)

      // Both parsers should handle invalid content
      expect(ftseParser.validateFormat(invalidContent)).toBe(false)
      expect(russellParser.validateFormat(invalidContent)).toBe(false)
    })
  })

  describe('getEssentialData comparison', () => {
    it('should return different data structures for each parser', () => {
      const ftseParser = new FTSE100Parser()
      const russellParser = new RussellDailyValuesParser()

      const ftseData = [
        {
          indexCode: 'UKX',
          indexSectorName: 'FTSE 100 Index',
          numberOfConstituents: 100,
          indexBaseCurrency: 'GBP',
          gbpIndex: 5017.25,
        },
      ]

      const russellData = [
        {
          indexName: 'Russell 1000® Index',
          close: 1245.5,
        },
      ]

      const ftseEssential = ftseParser.getEssentialData(ftseData)
      const russellEssential = russellParser.getEssentialData(russellData)

      // FTSE essential data should have 5 fields
      expect(Object.keys(ftseEssential[0])).toHaveLength(5)
      expect(ftseEssential[0]).toHaveProperty('indexCode')
      expect(ftseEssential[0]).toHaveProperty('gbpIndex')

      // Russell essential data should have 2 fields
      expect(Object.keys(russellEssential[0])).toHaveLength(2)
      expect(russellEssential[0]).toHaveProperty('indexName')
      expect(russellEssential[0]).toHaveProperty('close')

      // Ensure they don't have overlapping properties
      expect(ftseEssential[0]).not.toHaveProperty('close')
      expect(russellEssential[0]).not.toHaveProperty('indexCode')
    })
  })
})
