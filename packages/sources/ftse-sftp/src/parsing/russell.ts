import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

/**
 * Specific data structure for Russell Daily Values data
 * Only includes the essential fields: indexName and close
 */
export interface RussellDailyValuesData extends ParsedData {
  indexName: string
  close: number | null
}

/**
 * CSV Parser for Russell Daily Values format
 * Only extracts indexName and close fields
 */
export class RussellDailyValuesParser extends BaseCSVParser {
  private readonly expectedColumns = [
    'Index Name', // We'll treat the index name as the first column
    'Open',
    'High',
    'Low',
    'Close',
  ]

  constructor() {
    // Russell daily values data is tab-separated
    super({
      delimiter: '\t',
      columns: false, // We'll handle the headers manually since they're complex
      skip_empty_lines: true,
      trim: true,
    })
  }

  getExpectedColumns(): string[] {
    return this.expectedColumns
  }

  async parse(csvContent: string): Promise<RussellDailyValuesData[]> {
    const lines = csvContent.split(/\r?\n/)
    const results: RussellDailyValuesData[] = []

    // Find the start of actual data - look for lines that start with "Russell"
    const dataLines = lines.filter((line) => {
      const trimmed = line.trim()
      return trimmed.startsWith('Russell') && (trimmed.includes('®') || trimmed.includes('�'))
    })

    if (dataLines.length === 0) {
      throw new Error('Could not find Russell index data in the provided content')
    }

    // Parse each Russell data line using csv-parse
    for (const line of dataLines) {
      try {
        // Parse a single line as CSV
        const parsed = this.parseCSV(line, { columns: false })

        if (!parsed || parsed.length === 0 || !parsed[0] || parsed[0].length < 5) {
          console.warn(`Skipping line with insufficient fields: ${line.substring(0, 100)}`)
          continue
        }

        const fields = parsed[0] // First (and only) row from parsing single line

        const data: RussellDailyValuesData = {
          indexName: this.convertValue(fields[0], 'string') as string,
          close: this.convertValue(fields[4], 'number') as number | null,
        }

        // Additional validation for required fields
        if (!data.indexName || data.indexName === '') {
          console.warn(`Missing required index name field in line: ${line.substring(0, 100)}`)
          continue
        }

        results.push(data)
      } catch (error) {
        console.error(`Error parsing line: ${line.substring(0, 100)}`, error)
        // Continue with next line instead of failing completely
      }
    }

    return results
  }

  /**
   * Enhanced validation specific to Russell Daily Values format
   */
  validateFormat(csvContent: string): boolean {
    if (!csvContent || csvContent.trim().length === 0) {
      return false
    }

    // Check if the content contains Russell index data
    return csvContent.includes('Russell') && (csvContent.includes('®') || csvContent.includes('�'))
  }

  /**
   * Get essential Russell daily values data fields
   */
  getEssentialData(data: RussellDailyValuesData[]): Array<{
    indexName: string
    close: number | null
  }> {
    return data.map((item) => ({
      indexName: item.indexName,
      close: item.close,
    }))
  }
}
