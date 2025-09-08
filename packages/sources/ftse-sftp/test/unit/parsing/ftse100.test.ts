import { FTSE100Parser } from '../../../src/parsing/ftse100'
import { createFTSETestData, ftseDataRows, ftseCsvFixture } from './fixtures'

describe('FTSE100Parser', () => {
  let parser: FTSE100Parser

  beforeEach(() => {
    parser = new FTSE100Parser()
  })

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(parser).toBeDefined()
    })
  })

  describe('validateFormat', () => {
    it('should return false for empty content', () => {
      expect(parser.validateFormat('')).toBe(false)
    })

    it('should return false for content without Index Code header', () => {
      const invalidContent = 'Some random content\nwithout proper headers'
      expect(parser.validateFormat(invalidContent)).toBe(false)
    })

    it('should return true for valid FTSE format', () => {
      expect(parser.validateFormat(ftseCsvFixture)).toBe(true)
    })

    it('should return false for content missing required columns', () => {
      const invalidContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Wrong Header,Some Other Column
UKX,Some Value`

      expect(parser.validateFormat(invalidContent)).toBe(false)
    })

    it('should throw error when CSV parsing fails during validation', () => {
      // Create malformed CSV content that will cause parseCSV to throw an error
      const malformedContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,GBP Index
UKX,"Unclosed quote field`

      expect(() => parser.validateFormat(malformedContent)).toThrow('Error validating CSV format:')
    })
  })

  describe('parse', () => {
    it('should parse valid FTSE CSV content correctly', async () => {
      const csvContent = createFTSETestData([ftseDataRows.ftse100])

      const result = await parser.parse(csvContent)

      expect(result).toEqual([
        {
          indexCode: 'UKX',
          indexSectorName: 'FTSE 100 Index',
          numberOfConstituents: 100,
          indexBaseCurrency: 'GBP',
          gbpIndex: 4926.96924528,
        },
      ])
    })

    it('should throw error for invalid CSV format', async () => {
      const invalidContent = 'Invalid CSV content without proper headers'

      await expect(parser.parse(invalidContent)).rejects.toThrow('Invalid CSV format for FTSE data')
    })

    it('should throw error when Index Code header is not found', async () => {
      const invalidContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Wrong Header,Some Column
UKX,Some Value`

      await expect(parser.parse(invalidContent)).rejects.toThrow('Invalid CSV format for FTSE data')
    })

    it('should skip lines with insufficient fields', async () => {
      const csvContent = createFTSETestData([
        ftseDataRows.ftse100,
        'INVALID_ROW,OnlyTwoFields',
        ftseDataRows.allSmall, // This should be filtered out
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include UKX and skip invalid row and AS0
      expect(result[0].indexCode).toBe('UKX')
    })

    it('should skip lines with empty index code', async () => {
      const csvContent = createFTSETestData([
        ftseDataRows.ftse100,
        ',Empty Index Code,543,GBP,4659.78,5017.13,4523.79',
        ftseDataRows.allSmall, // This should be filtered out
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include UKX, skip empty index code and AS0
      expect(result[0].indexCode).toBe('UKX')
    })

    it('should handle null values correctly', async () => {
      const csvContent = createFTSETestData(['UKX,FTSE 100 Index,,GBP,4659.89,,4523.90'])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1)
      expect(result[0].indexCode).toBe('UKX')
      expect(result[0].numberOfConstituents).toBeNull()
      expect(result[0].gbpIndex).toBeNull()
    })

    it('should skip empty lines in data section', async () => {
      const csvContent = createFTSETestData([
        ftseDataRows.ftse100,
        '',
        ftseDataRows.allSmall, // This should be filtered out
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include UKX, skip empty line and AS0
      expect(result[0].indexCode).toBe('UKX')
    })

    it('should throw error when multiple FTSE 100 index records are found', async () => {
      const csvContent = createFTSETestData([
        ftseDataRows.ftse100,
        'UKX,FTSE 100 Index (Duplicate),100,GBP,4659.89,5017.25,4523.90',
      ])

      await expect(parser.parse(csvContent)).rejects.toThrow(
        'Multiple FTSE 100 index records found, expected only one',
      )
    })
  })
})
