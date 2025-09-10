import { Options, parse } from 'csv-parse/sync'
import { CSVParser, ParsedData } from './interfaces'

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
  protected parseCSV(csvContent: string, options?: Options): any {
    const finalConfig: Options = { ...this.config, ...options }

    try {
      return parse(csvContent, finalConfig)
    } catch (error) {
      throw new Error(`Error parsing CSV: ${error}`)
    }
  }

  /**
   * Convert a string value to a number, handling commas and invalid values
   */
  protected convertToNumber(value: string): number | null {
    if (!value || value.trim() === '') {
      return null
    }
    const numValue = parseFloat(value.replace(/,/g, ''))
    return isNaN(numValue) ? null : numValue
  }
}
