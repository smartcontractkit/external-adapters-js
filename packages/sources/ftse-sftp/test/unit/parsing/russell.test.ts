import { RussellDailyValuesParser, RussellDailyValuesData } from '../../../src/parsing/russell'

// Helper function to create test data with actual comma separators
const createRussellTestData = (dataRows: string[]): string => {
  const preamble = `Russell Daily Values for August 26, 2025
Currency: USD
Performance data as of market close`

  if (dataRows.length === 0) {
    return preamble
  }

  return preamble + '\n\n' + dataRows.join('\n')
}

describe('RussellDailyValuesParser', () => {
  let parser: RussellDailyValuesParser

  beforeEach(() => {
    parser = new RussellDailyValuesParser()
  })

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(parser).toBeDefined()
      expect(parser.getExpectedColumns()).toContain('Index Name')
      expect(parser.getExpectedColumns()).toContain('Close')
    })
  })

  describe('getExpectedColumns', () => {
    it('should return expected column names', () => {
      const expectedColumns = parser.getExpectedColumns()

      expect(expectedColumns).toEqual(['Index Name', 'Open', 'High', 'Low', 'Close'])
    })
  })

  describe('validateFormat', () => {
    it('should return false for empty content', () => {
      expect(parser.validateFormat('')).toBe(false)
    })

    it('should return false for content without Russell indices', () => {
      const invalidContent = 'Some random content\nwithout Russell data'
      expect(parser.validateFormat(invalidContent)).toBe(false)
    })

    it('should return true for valid Russell format', () => {
      const validContent = `Russell Daily Values
Some header information

Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25`

      expect(parser.validateFormat(validContent)).toBe(true)
    })

    it('should return false for content without ® symbol', () => {
      const invalidContent = `Some header
Russell 1000 Index,1234.56,1250.00`

      expect(parser.validateFormat(invalidContent)).toBe(false)
    })
  })

  describe('parse', () => {
    it('should parse valid Russell CSV content correctly', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2)

      // Test first row
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(1245.5)

      // Test second row
      expect(result[1].indexName).toBe('Russell 2000® Index')
      expect(result[1].close).toBe(990.25)
    })

    it('should throw error when no Russell index data is found', async () => {
      const invalidContent = `Some header information
Without any Russell indices
Just random data`

      await expect(parser.parse(invalidContent)).rejects.toThrow(
        'Could not find Russell index data in the provided content',
      )
    })

    it('should skip lines that do not start with Russell', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        'Some other index,987.65,995.00,980.00,990.25,2.60',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2) // Should skip the non-Russell line
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[1].indexName).toBe('Russell 2000® Index')
    })

    it('should skip lines with insufficient fields', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        'Russell Short® Index,987.65,995.00,980.00',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2) // Should skip the line with insufficient fields
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[1].indexName).toBe('Russell 2000® Index')
    })

    it('should skip lines with empty index name', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        ',1234.56,1250.00,1220.00,1245.50,10.94',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2) // Should skip the line with empty index name
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[1].indexName).toBe('Russell 2000® Index')
    })

    it('should handle null close values correctly', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBeNull()
    })

    it('should handle numeric values with commas', async () => {
      const csvContent = createRussellTestData([
        '"Russell 1000® Index","1,234.56","1,250.00","1,220.00","1,245.50",10.94,0.88,"1,280.00","1,200.00",45.50,3.79,"1,300.00","1,100.00",145.50,13.25',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(1245.5)
    })

    it('should skip empty lines', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        '',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(2)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[1].indexName).toBe('Russell 2000® Index')
    })
  })

  describe('getEssentialData', () => {
    it('should return only essential fields', () => {
      const mockData: RussellDailyValuesData[] = [
        {
          indexName: 'Russell 1000® Index',
          close: 1245.5,
        },
        {
          indexName: 'Russell 2000® Index',
          close: 990.25,
        },
      ]

      const essential = parser.getEssentialData(mockData)

      expect(essential).toHaveLength(2)
      expect(essential[0]).toEqual({
        indexName: 'Russell 1000® Index',
        close: 1245.5,
      })
      expect(essential[1]).toEqual({
        indexName: 'Russell 2000® Index',
        close: 990.25,
      })
    })

    it('should handle null values in essential data', () => {
      const mockData: RussellDailyValuesData[] = [
        {
          indexName: 'Russell 1000® Index',
          close: null,
        },
      ]

      const essential = parser.getEssentialData(mockData)

      expect(essential).toHaveLength(1)
      expect(essential[0]).toEqual({
        indexName: 'Russell 1000® Index',
        close: null,
      })
    })

    it('should handle empty dataset', () => {
      const mockData: RussellDailyValuesData[] = []
      const essential = parser.getEssentialData(mockData)

      expect(essential).toHaveLength(0)
    })
  })
})
