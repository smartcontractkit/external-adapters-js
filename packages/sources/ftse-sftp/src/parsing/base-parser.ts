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
  abstract parse(csvContent: string): Promise<{
    result: number
    parsedData: T
  }>

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
      throw new Error('Cannot convert empty or null value to number')
    }
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      throw new Error(`Value "${value}" is not a valid number`)
    }
    return numValue
  }
}
