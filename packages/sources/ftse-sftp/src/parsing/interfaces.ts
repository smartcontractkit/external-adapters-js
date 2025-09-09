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
}

/**
 * Generic parsed data structure
 */
export interface ParsedData {
  [key: string]: string | number | Date | null
}
