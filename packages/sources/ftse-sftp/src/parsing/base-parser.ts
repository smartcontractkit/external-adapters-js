import { CSVParser, ParsedData } from './interfaces'
import { parse, Options } from 'csv-parse/sync'

/**
 * Abstract base class for CSV parsers
 * Uses the csv-parse library for robust CSV parsing
 */
export abstract class BaseCSVParser implements CSVParser {
  protected config: Options

  constructor(config: Options = {}) {
    this.config = { ...config }
  }

  /**
   * Abstract method that must be implemented by concrete classes
   */
  abstract parse(csvContent: string): Promise<ParsedData[]>

  /**
   * Helper method to parse CSV content using csv-parse library
   */
  protected parseCSV(csvContent: string, options?: Options): any[] {
    const finalConfig: Options = { ...this.config, ...options }

    try {
      return parse(csvContent, finalConfig)
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

    switch (expectedType) {
      case 'number': {
        const numValue = parseFloat(value.replace(/,/g, ''))
        return isNaN(numValue) ? null : numValue
      }

      case 'date': {
        const dateValue = new Date(value)
        return isNaN(dateValue.getTime()) ? null : dateValue
      }

      default:
        return value.trim()
    }
  }
}
