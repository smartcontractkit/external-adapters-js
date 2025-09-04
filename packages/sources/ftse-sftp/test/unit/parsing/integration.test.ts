import { FTSE100Parser } from '../../../src/parsing/ftse100'
import { RussellDailyValuesParser } from '../../../src/parsing/russell'

// Helper functions to create test data with proper separators
const createFTSETestData = (dataRows: string[]): string => {
  const header =
    'Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index'
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
Currency: USD
Performance data as of market close



`

  if (dataRows.length === 0) {
    return preamble
  }

  return preamble + dataRows.join('\n')
}

describe('CSV Parsers Integration', () => {
  describe('FTSE100Parser and RussellDailyValuesParser', () => {
    it('should handle different CSV formats independently', async () => {
      const ftseParser = new FTSE100Parser()
      const russellParser = new RussellDailyValuesParser('Russell 1000® Index')

      // Sample FTSE data
      const ftseContent = createFTSETestData([
        'UKX,FTSE 100 Index,100,GBP,4659.89484111,5017.24846324,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,5017.24846324',
      ])

      // Sample Russell data
      const russellContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
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
      const russellParser = new RussellDailyValuesParser('Russell 1000® Index')

      // Try to parse Russell data with FTSE parser
      const russellContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
      ])

      // Try to parse FTSE data with Russell parser
      const ftseContent = createFTSETestData(['UKX,FTSE 100 Index,5017.25'])

      // FTSE parser should reject Russell format
      await expect(ftseParser.parse(russellContent)).rejects.toThrow()

      // Russell parser should reject FTSE format
      await expect(russellParser.parse(ftseContent)).rejects.toThrow()
    })

    it('should handle empty or invalid data gracefully', async () => {
      const ftseParser = new FTSE100Parser()
      const russellParser = new RussellDailyValuesParser('Russell 1000® Index')

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
      const russellParser = new RussellDailyValuesParser('Russell 1000® Index')

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
