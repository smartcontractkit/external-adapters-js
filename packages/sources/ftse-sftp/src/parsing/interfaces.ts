/**
 * Interface for CSV parsing strategies
 */
export interface CSVParser<T extends ParsedData = ParsedData> {
  /**
   * Parse CSV content and return structured data
   * @param csvContent - Raw CSV content as string
   * @returns Promise of parsed data
   */
  parse(csvContent: string): Promise<{
    result: number
    parsedData: T
  }>
}

/**
 * Generic parsed data structure
 */
export interface ParsedData {
  [key: string]: string | number | null
}
