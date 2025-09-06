import { FTSE100Parser } from '../../../src/parsing/ftse100'

// Helper function to create test data with actual comma separators
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
      const validContent = createFTSETestData([
        'UKX,FTSE 100 Index,100,GBP,4659.89,5017.25,4523.90',
      ])

      expect(parser.validateFormat(validContent)).toBe(true)
    })

    it('should return false for content missing required columns', () => {
      const invalidContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Wrong Header,Some Other Column
UKX,Some Value`

      expect(parser.validateFormat(invalidContent)).toBe(false)
    })
  })

  describe('parse', () => {
    it('should parse valid FTSE CSV content correctly', async () => {
      const csvContent = createFTSETestData([
        'UKX,FTSE 100 Index,100,GBP,4659.89484111,5017.24846324,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,5017.24846324',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toEqual([
        {
          indexCode: 'UKX',
          indexSectorName: 'FTSE 100 Index',
          numberOfConstituents: 100,
          indexBaseCurrency: 'GBP',
          gbpIndex: 5017.24846324,
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
        'UKX,FTSE 100 Index,100,GBP,4659.89,5017.25,4523.90',
        'INVALID_ROW,OnlyTwoFields',
        'AS0,FTSE All-Small Index,234,GBP,4659.78,5017.13,4523.79', // This should be filtered out
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include UKX and skip invalid row and AS0
      expect(result[0].indexCode).toBe('UKX')
    })

    it('should skip lines with empty index code', async () => {
      const csvContent = createFTSETestData([
        'UKX,FTSE 100 Index,100,GBP,4659.89,5017.25,4523.90',
        ',Empty Index Code,543,GBP,4659.78,5017.13,4523.79',
        'AS0,FTSE All-Small Index,234,GBP,4659.78,5017.13,4523.79', // This should be filtered out
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
        'UKX,FTSE 100 Index,100,GBP,4659.89,5017.25,4523.90',
        '',
        'AS0,FTSE All-Small Index,234,GBP,4659.78,5017.13,4523.79', // This should be filtered out
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include UKX, skip empty line and AS0
      expect(result[0].indexCode).toBe('UKX')
    })
  })
})
