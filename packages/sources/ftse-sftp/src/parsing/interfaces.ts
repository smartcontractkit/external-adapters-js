/**
 * Interface for CSV parsing strategies
 */
export interface CSVParser {
  /**
   * Parse CSV content and return structured data
   * @param csvContent - Raw CSV content as string
   * @returns Promise of parsed data
   */
  parse(csvContent: string): Promise<ParsedData[]>

  /**
   * Validate the CSV format
   * @param csvContent - Raw CSV content as string
   * @returns boolean indicating if the format is valid
   */
  validateFormat(csvContent: string): boolean

  /**
   * Get the expected columns for this CSV format
   * @returns Array of expected column names
   */
  getExpectedColumns(): string[]
}

/**
 * Generic parsed data structure
 */
export interface ParsedData {
  [key: string]: string | number | Date | null
}

/**
 * Configuration options for CSV parsing
 */
export interface CSVParserConfig {
  delimiter?: string
  hasHeader?: boolean
  skipEmptyLines?: boolean
  trimWhitespace?: boolean
  encoding?: string
}

/**
 * Base configuration with default values
 */
export const defaultCSVConfig: CSVParserConfig = {
  delimiter: ',',
  hasHeader: true,
  skipEmptyLines: true,
  trimWhitespace: true,
  encoding: 'utf-8',
}
