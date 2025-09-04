import { RussellDailyValuesParser, RussellDailyValuesData } from '../../../src/parsing/russell'

// Helper function to create test data with actual comma separators
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

describe('RussellDailyValuesParser', () => {
  let parser: RussellDailyValuesParser
  const testInstrument = 'Russell 1000® Index'

  beforeEach(() => {
    parser = new RussellDailyValuesParser(testInstrument)
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

    it('should return false for content without Russell indices', () => {
      const invalidContent = 'Some random content\nwithout Russell data'
      expect(parser.validateFormat(invalidContent)).toBe(false)
    })

    it('should return true for valid Russell format', () => {
      const validContent = `Russell Daily Values
Some header information
Performance data as of market close



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

      expect(result).toHaveLength(1) // Only Russell 1000® Index should match the instrument

      // Test filtered row (Russell 1000® Index matches our test instrument)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(1245.5)
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

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument) and skip the non-Russell line
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should skip lines with insufficient fields', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        'Russell Short® Index,987.65,995.00,980.00',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument) and skip the line with insufficient fields
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should skip lines with empty index name', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        ',1234.56,1250.00,1220.00,1245.50,10.94',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument) and skip the line with empty index name
      expect(result[0].indexName).toBe('Russell 1000® Index')
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

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument)
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should filter results based on instrument parameter', async () => {
      const russell2000Parser = new RussellDailyValuesParser('Russell 2000® Index')
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
        'Russell 2000® Index,987.65,995.00,980.00,990.25,2.60,0.26,1010.00,970.00,20.25,2.09,1050.00,920.00,70.25,7.64',
        'Russell 3000® Index,456.78,460.00,450.00,455.00,1.22,0.27,470.00,440.00,15.00,3.40,480.00,430.00,25.00,5.80',
      ])

      const result = await russell2000Parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 2000® Index
      expect(result[0].indexName).toBe('Russell 2000® Index')
      expect(result[0].close).toBe(990.25)
    })

    it('should handle normalized string matching', async () => {
      // Test that the normalization handles special characters correctly
      const normalizedParser = new RussellDailyValuesParser('Russell 1000 Index') // Without ® symbol
      const csvContent = createRussellTestData([
        'Russell 1000® Index,1234.56,1250.00,1220.00,1245.50,10.94,0.88,1280.00,1200.00,45.50,3.79,1300.00,1100.00,145.50,13.25',
      ])

      const result = await normalizedParser.parse(csvContent)

      expect(result).toHaveLength(1) // Should match despite different special characters
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(1245.5)
    })
  })
})
