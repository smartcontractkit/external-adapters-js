import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

// Column indices for Russell CSV format
const INDEX_NAME_COLUMN = 0
const VALUE_COLUMN = 4

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
  private readonly instrument: string

  constructor(instrument: string) {
    super({
      delimiter: ',',
      columns: false, // No headers, data accessed as arrays
      skip_empty_lines: true,
      trim: true,
    })
    this.instrument = instrument
  }

  async parse(csvContent: string): Promise<RussellDailyValuesData[]> {
    const results: RussellDailyValuesData[] = []

    if (!this.validateFormat(csvContent)) {
      throw new Error('Invalid CSV format for Russell data')
    }

    // Russell data starts after the header rows, which vary in position
    // Parse the entire CSV and find Russell rows dynamically
    const parsed = this.parseCSV(csvContent, {
      relax_column_count: true, // Allow rows with different number of columns
    })

    for (const row of parsed) {
      if (!row || row.length < 5) {
        // Need at least 5 columns for index name and close value
        continue // Skip rows with insufficient fields
      }

      // Skip empty rows (CSV contains separator rows with multiple empty fields)
      const hasContent = row.some((field: any) => field && String(field).trim() !== '')
      if (!hasContent) {
        continue // Skip empty rows
      }

      const indexName = this.convertValue(row[INDEX_NAME_COLUMN], 'string') as string

      // Only process rows that start with "Russell" and contain the ® symbol
      if (
        !indexName ||
        !indexName.includes('Russell') ||
        (!indexName.includes('®') && !indexName.includes('�'))
      ) {
        continue
      }

      const data: RussellDailyValuesData = {
        indexName,
        close: this.convertValue(row[VALUE_COLUMN], 'number') as number | null,
      }

      // Filter by instrument if specified
      if (this.instrument) {
        // Normalize both strings for comparison (remove special characters and extra spaces)
        const normalizeString = (str: string) =>
          str.replace(/[®�™]/g, '').replace(/\s+/g, ' ').trim()
        const normalizedIndexName = normalizeString(indexName)
        const normalizedInstrument = normalizeString(this.instrument)

        if (normalizedIndexName === normalizedInstrument) {
          results.push(data)
        }
      } else {
        results.push(data)
      }
    }

    return results
  }

  /**
   * Validate that the CSV contains Russell index data
   */
  validateFormat(csvContent: string): boolean {
    if (!csvContent || csvContent.trim().length === 0) {
      return false
    }

    try {
      // Parse the entire CSV with relaxed column count to find Russell data
      const parsed = this.parseCSV(csvContent, {
        relax_column_count: true,
      })

      if (!parsed || parsed.length === 0) {
        console.error('No data rows found in CSV for Russell validation')
        return false
      }

      // Check if any row contains valid Russell index data
      const hasValidRussellData = parsed.some(
        (row) =>
          row &&
          row.length >= 5 && // Must have at least 5 columns for index name and close value
          row[INDEX_NAME_COLUMN] &&
          String(row[INDEX_NAME_COLUMN]).includes('Russell') &&
          (String(row[INDEX_NAME_COLUMN]).includes('®') ||
            String(row[INDEX_NAME_COLUMN]).includes('�')),
      )

      if (!hasValidRussellData) {
        console.error('No valid Russell index data found in CSV validation')
        return false
      }

      return true
    } catch (error) {
      console.error('Error during Russell CSV validation:', error)
      return false
    }
  }
}
