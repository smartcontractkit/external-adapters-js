import { CSVParser, ParsedData, CSVParserConfig, defaultCSVConfig } from './interfaces'
import * as csvParse from 'csv-parse/sync'

/**
 * Abstract base class for CSV parsers
 * Uses the csv-parse library for robust CSV parsing
 */
export abstract class BaseCSVParser implements CSVParser {
  protected config: CSVParserConfig

  constructor(config: Partial<CSVParserConfig> = {}) {
    this.config = { ...defaultCSVConfig, ...config }
  }

  /**
   * Abstract method that must be implemented by concrete classes
   */
  abstract parse(csvContent: string): Promise<ParsedData[]>

  /**
   * Abstract method that must be implemented by concrete classes
   */
  abstract getExpectedColumns(): string[]

  /**
   * Default validation - checks if content is not empty and has expected structure
   * Can be overridden by concrete classes for specific validation logic
   */
  validateFormat(csvContent: string): boolean {
    if (!csvContent || csvContent.trim().length === 0) {
      return false
    }

    try {
      // Try to parse the CSV to see if it's valid
      const parsed = csvParse.parse(csvContent, {
        ...this.config,
        from_line: 1,
        to_line: 5, // Only parse first few lines for validation
      })

      if (!parsed || parsed.length === 0) {
        return false
      }

      // If columns are expected, check if header matches expected columns
      if (this.config.columns) {
        const headers = Object.keys(parsed[0])
        const expectedColumns = this.getExpectedColumns()

        // Basic check - at least some expected columns should be present
        return expectedColumns.some((col) => headers.includes(col))
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Helper method to parse CSV content using csv-parse library
   */
  protected parseCSV(csvContent: string, options?: Partial<CSVParserConfig>): any[] {
    const finalConfig = { ...this.config, ...options }

    try {
      return csvParse.parse(csvContent, finalConfig)
    } catch (error) {
      throw new Error(`Error parsing CSV: ${error}`)
    }
  }

  /**
   * Convert a string value to appropriate type
   */
  protected convertValue(
    value: string,
    expectedType: 'string' | 'number' | 'date' = 'string',
  ): string | number | Date | null {
    if (!value || value.trim() === '') {
      return null
    }

    const trimmedValue = value.trim()

    switch (expectedType) {
      case 'number': {
        const numValue = parseFloat(trimmedValue.replace(/,/g, ''))
        return isNaN(numValue) ? null : numValue
      }

      case 'date': {
        const dateValue = new Date(trimmedValue)
        return isNaN(dateValue.getTime()) ? null : dateValue
      }

      case 'string':
      default:
        return trimmedValue
    }
  }

  /**
   * Map parsed CSV row to structured data with type conversion
   */
  protected mapRowToObject(
    row: Record<string, string>,
    fieldMapping: Record<string, { column: string; type?: 'string' | 'number' | 'date' }>,
  ): ParsedData {
    const result: ParsedData = {}

    for (const [key, mapping] of Object.entries(fieldMapping)) {
      const value = row[mapping.column] || ''
      result[key] = this.convertValue(value, mapping.type || 'string')
    }

    return result
  }
}
