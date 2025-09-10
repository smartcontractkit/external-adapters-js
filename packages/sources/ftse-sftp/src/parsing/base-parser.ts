import { Options, parse } from 'csv-parse/sync'
import { CSVParser, ParsedData } from './interfaces'

/**
 * Abstract base class for CSV parsers
 * Uses the csv-parse library for robust CSV parsing
 */
export abstract class BaseCSVParser<T extends ParsedData = ParsedData> implements CSVParser<T> {
  protected config: Options

  constructor(config: Options = {}) {
    this.config = { ...config }
  }

  /**
   * Abstract method that must be implemented by concrete classes
   */
  abstract parse(csvContent: string): Promise<T>

  /**
   * Helper method to parse CSV content as records with column headers
   */
  protected parseCSVRecords(csvContent: string, options?: Options): Record<string, string>[] {
    const finalConfig: Options = { ...this.config, ...options, columns: true }

    try {
      return parse(csvContent, finalConfig)
    } catch (error) {
      throw new Error(`Error parsing CSV as records: ${error}`)
    }
  }

  /**
   * Helper method to parse CSV content as arrays
   */
  protected parseCSVArrays(csvContent: string, options?: Options): string[][] {
    const finalConfig: Options = { ...this.config, ...options, columns: false }

    try {
      return parse(csvContent, finalConfig)
    } catch (error) {
      throw new Error(`Error parsing CSV as arrays: ${error}`)
    }
  }

  /**
   * Convert a string value to a number and invalid values
   */
  protected convertToNumber(value: string): number {
    if (!value || value.trim() === '') {
      return 0
    }
    const numValue = parseFloat(value)
    return isNaN(numValue) ? 0 : numValue
  }
}
