import { RussellDailyValuesParser } from '../../../src/parsing/russell'
import { createRussellTestData, russellDataRows, russellCsvFixture } from './fixtures'

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
      expect(parser.validateFormat(russellCsvFixture)).toBe(true)
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
        russellDataRows.russell1000,
        russellDataRows.russell2000,
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Only Russell 1000® Index should match the instrument

      // Test filtered row (Russell 1000® Index matches our test instrument)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(3547.4)
    })

    it('should throw error when no Russell index data is found', async () => {
      const invalidContent = `Some header information
Without any Russell indices
Just random data`

      await expect(parser.parse(invalidContent)).rejects.toThrow(
        'Invalid CSV format for Russell data',
      )
    })

    it('should skip lines that do not start with Russell', async () => {
      const csvContent = createRussellTestData([
        russellDataRows.russell1000,
        'Some other index,987.65,995.00,980.00,990.25,2.60',
        russellDataRows.russell2000,
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument) and skip the non-Russell line
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should skip lines with insufficient fields', async () => {
      const csvContent = createRussellTestData([
        russellDataRows.russell1000,
        'Russell Short® Index,987.65,995.00,980.00',
        russellDataRows.russell2000,
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument) and skip the line with insufficient fields
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should skip lines with empty index name', async () => {
      const csvContent = createRussellTestData([
        russellDataRows.russell1000,
        ',1234.56,1250.00,1220.00,1245.50,10.94',
        russellDataRows.russell2000,
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument) and skip the line with empty index name
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should handle null close values correctly', async () => {
      const csvContent = createRussellTestData([
        'Russell 1000® Index,3538.25,3550.79,3534.60,,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBeNull()
    })

    it('should handle numeric values with commas', async () => {
      const csvContent = createRussellTestData([
        '"Russell 1000® Index","3,538.25","3,550.79","3,534.60","3,547.40",9.16,0.26,"3,547.40","3,483.25",51.20,1.46,"3,547.40","2,719.99",496.76,16.28',
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1)
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(3547.4)
    })

    it('should skip empty lines', async () => {
      const csvContent = createRussellTestData([
        russellDataRows.russell1000,
        '',
        russellDataRows.russell2000,
      ])

      const result = await parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 1000® Index (matches instrument)
      expect(result[0].indexName).toBe('Russell 1000® Index')
    })

    it('should filter results based on instrument parameter', async () => {
      const russell2000Parser = new RussellDailyValuesParser('Russell 2000® Index')
      const csvContent = createRussellTestData([
        russellDataRows.russell1000,
        russellDataRows.russell2000,
        russellDataRows.russell3000,
      ])

      const result = await russell2000Parser.parse(csvContent)

      expect(result).toHaveLength(1) // Should only include Russell 2000® Index
      expect(result[0].indexName).toBe('Russell 2000® Index')
      expect(result[0].close).toBe(2373.8)
    })

    it('should handle normalized string matching', async () => {
      // Test that the normalization handles special characters correctly
      const normalizedParser = new RussellDailyValuesParser('Russell 1000 Index') // Without ® symbol
      const csvContent = createRussellTestData([russellDataRows.russell1000])

      const result = await normalizedParser.parse(csvContent)

      expect(result).toHaveLength(1) // Should match despite different special characters
      expect(result[0].indexName).toBe('Russell 1000® Index')
      expect(result[0].close).toBe(3547.4)
    })
  })
})
