import { FTSE100Parser, FTSE100Data } from '../../../src/parsing/ftse100'

// Helper function to create test data with actual tab separators
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

describe('FTSE100Parser', () => {
  let parser: FTSE100Parser

  beforeEach(() => {
    parser = new FTSE100Parser()
  })

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(parser).toBeDefined()
      expect(parser.getExpectedColumns()).toContain('Index Code')
      expect(parser.getExpectedColumns()).toContain('GBP Index')
    })
  })

  describe('getExpectedColumns', () => {
    it('should return expected column names', () => {
      const expectedColumns = parser.getExpectedColumns()

      expect(expectedColumns).toContain('Index Code')
      expect(expectedColumns).toContain('Index/Sector Name')
      expect(expectedColumns).toContain('Number of Constituents')
      expect(expectedColumns).toContain('Index Base Currency')
      expect(expectedColumns).toContain('GBP Index')
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
        'AS0\tFTSE All-Small Index\t234\tGBP\t4659.89\t5017.25\t4523.90',
      ])

      expect(parser.validateFormat(validContent)).toBe(true)
    })

    it('should return false for content missing required columns', () => {
      const invalidContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Wrong Header\tSome Other Column
AS0\tSome Value`

      expect(parser.validateFormat(invalidContent)).toBe(false)
    })
  })

  describe('parse', () => {
    it('should parse valid FTSE CSV content correctly', async () => {
      const csvContent = createFTSETestData([
        'AS0\tFTSE All-Small Index\t234\tGBP\t4659.89484111\t5017.24846324\t4523.90007694\t2963.46786723\t6470.75900926\t10384.47293100\t4667.43880552\t5177.36970414\t\t5017.24846324',
        'ASX\tFTSE All-Share Index\t543\tGBP\t4659.78333168\t5017.12840249\t4523.79182181\t2963.39695263\t6470.60416658\t10384.22443471\t4667.32711557\t5177.24581174\t\t5017.12840249',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2)

      // Test first row
      expect(result[0].indexCode).toBe('AS0')
      expect(result[0].indexSectorName).toBe('FTSE All-Small Index')
      expect(result[0].numberOfConstituents).toBe(234)
      expect(result[0].indexBaseCurrency).toBe('GBP')
      expect(result[0].gbpIndex).toBe(5017.24846324)

      // Test second row
      expect(result[1].indexCode).toBe('ASX')
      expect(result[1].indexSectorName).toBe('FTSE All-Share Index')
      expect(result[1].numberOfConstituents).toBe(543)
      expect(result[1].indexBaseCurrency).toBe('GBP')
      expect(result[1].gbpIndex).toBe(5017.12840249)
    })

    it('should throw error for invalid CSV format', async () => {
      const invalidContent = 'Invalid CSV content without proper headers'

      await expect(parser.parse(invalidContent)).rejects.toThrow('Invalid CSV format for FTSE data')
    })

    it('should throw error when Index Code header is not found', async () => {
      const invalidContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Wrong Header\tSome Column
AS0\tSome Value`

      await expect(parser.parse(invalidContent)).rejects.toThrow('Invalid CSV format for FTSE data')
    })

    it('should skip lines with insufficient fields', async () => {
      const csvContent = createFTSETestData([
        'AS0\tFTSE All-Small Index\t234\tGBP\t4659.89\t5017.25\t4523.90',
        'INVALID_ROW\tOnlyTwoFields',
        'ASX\tFTSE All-Share Index\t543\tGBP\t4659.78\t5017.13\t4523.79',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2) // Should skip the invalid row
      expect(result[0].indexCode).toBe('AS0')
      expect(result[1].indexCode).toBe('ASX')
    })

    it('should skip lines with empty index code', async () => {
      const csvContent = createFTSETestData([
        'AS0\tFTSE All-Small Index\t234\tGBP\t4659.89\t5017.25\t4523.90',
        '\tEmpty Index Code\t543\tGBP\t4659.78\t5017.13\t4523.79',
        'ASX\tFTSE All-Share Index\t543\tGBP\t4659.78\t5017.13\t4523.79',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2) // Should skip the row with empty index code
      expect(result[0].indexCode).toBe('AS0')
      expect(result[1].indexCode).toBe('ASX')
    })

    it('should handle null values correctly', async () => {
      const csvContent = createFTSETestData([
        'AS0\tFTSE All-Small Index\t\tGBP\t4659.89\t\t4523.90',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1)
      expect(result[0].indexCode).toBe('AS0')
      expect(result[0].numberOfConstituents).toBeNull()
      expect(result[0].gbpIndex).toBeNull()
    })

    it('should skip empty lines in data section', async () => {
      const csvContent = createFTSETestData([
        'AS0\tFTSE All-Small Index\t234\tGBP\t4659.89\t5017.25\t4523.90',
        '',
        'ASX\tFTSE All-Share Index\t543\tGBP\t4659.78\t5017.13\t4523.79',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2)
      expect(result[0].indexCode).toBe('AS0')
      expect(result[1].indexCode).toBe('ASX')
    })
  })

  describe('getEssentialData', () => {
    it('should return only essential fields', () => {
      const mockData: FTSE100Data[] = [
        {
          indexCode: 'AS0',
          indexSectorName: 'FTSE All-Small Index',
          numberOfConstituents: 234,
          indexBaseCurrency: 'GBP',
          gbpIndex: 5017.25,
        },
        {
          indexCode: 'ASX',
          indexSectorName: 'FTSE All-Share Index',
          numberOfConstituents: 543,
          indexBaseCurrency: 'GBP',
          gbpIndex: 5017.13,
        },
      ]

      const essential = parser.getEssentialData(mockData)

      expect(essential).toHaveLength(2)
      expect(essential[0]).toEqual({
        indexCode: 'AS0',
        indexSectorName: 'FTSE All-Small Index',
        numberOfConstituents: 234,
        indexBaseCurrency: 'GBP',
        gbpIndex: 5017.25,
      })
      expect(essential[1]).toEqual({
        indexCode: 'ASX',
        indexSectorName: 'FTSE All-Share Index',
        numberOfConstituents: 543,
        indexBaseCurrency: 'GBP',
        gbpIndex: 5017.13,
      })
    })

    it('should handle null values in essential data', () => {
      const mockData: FTSE100Data[] = [
        {
          indexCode: 'AS0',
          indexSectorName: 'FTSE All-Small Index',
          numberOfConstituents: null,
          indexBaseCurrency: 'GBP',
          gbpIndex: null,
        },
      ]

      const essential = parser.getEssentialData(mockData)

      expect(essential).toHaveLength(1)
      expect(essential[0]).toEqual({
        indexCode: 'AS0',
        indexSectorName: 'FTSE All-Small Index',
        numberOfConstituents: null,
        indexBaseCurrency: 'GBP',
        gbpIndex: null,
      })
    })
  })
})
