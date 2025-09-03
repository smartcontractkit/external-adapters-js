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
 * Configuration options for CSV parsing using csv-parse library
 */
export interface CSVParserConfig {
  delimiter?: string
  columns?: boolean | string[]
  skip_empty_lines?: boolean
  trim?: boolean
  encoding?: BufferEncoding
  from_line?: number
  to_line?: number
  relax_column_count?: boolean
  [key: string]: any // Allow other csv-parse options
}

/**
 * Base configuration with default values
 */
export const defaultCSVConfig: CSVParserConfig = {
  delimiter: ',',
  columns: true,
  skip_empty_lines: true,
  trim: true,
  encoding: 'utf8',
  relax_column_count: true, // Allow rows with different column counts
}
