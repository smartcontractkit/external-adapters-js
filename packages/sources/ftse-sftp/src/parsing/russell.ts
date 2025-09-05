import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

// Column indices for Russell CSV format
const INDEX_NAME_COLUMN = 0
const VALUE_COLUMN = 4
const EXPECTED_COLUMNS = 5

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

    // Russell data always starts on line 7, so skip the first 6 lines
    // Use existing config (delimiter, trim, etc.) and just specify from_line
    const parsed = this.parseCSV(csvContent, {
      from_line: 7, // Start parsing from line
    })

    for (const row of parsed) {
      if (!row || row.length < EXPECTED_COLUMNS) {
        // Expected columns based on the Russell Daily Values format
        continue // Skip rows with insufficient fields without logging
      }

      // Skip empty rows (where all fields are empty strings or just whitespace)
      const hasContent = row.some((field: any) => field && String(field).trim() !== '')
      if (!hasContent) {
        continue // Skip empty rows without logging
      }

      try {
        // csv-parse with trim: true should handle quote removal automatically
        const indexName = this.convertValue(row[INDEX_NAME_COLUMN], 'string') as string

        const data: RussellDailyValuesData = {
          indexName,
          close: this.convertValue(row[VALUE_COLUMN], 'number') as number | null,
        }

        // Additional validation for required fields
        if (!data.indexName || data.indexName === '') {
          console.warn(`Missing required index name field in row: ${JSON.stringify(row)}`)
          continue
        }

        // Normalize the string because of the ® symbol
        if (this.normalizeString(indexName) === this.normalizeString(this.instrument)) {
          results.push(data)
        }
      } catch (error) {
        console.error(`Error parsing row: ${JSON.stringify(row)}`, error)
      }
    }

    // Only throw error if no Russell data was found at all
    if (results.length === 0) {
      const hasRussellData = parsed.some(
        (row) =>
          row && row[INDEX_NAME_COLUMN] && String(row[INDEX_NAME_COLUMN]).includes('Russell'),
      )

      if (!hasRussellData) {
        throw new Error('Could not find Russell index data in the provided content')
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

    try {
      // Try to parse from line 7 to validate the format
      const parsed = this.parseCSV(csvContent, {
        from_line: 7,
        to_line: 16, // Parse more lines for validation to handle mixed content
      })

      if (!parsed || parsed.length === 0) {
        console.error('No data rows found in CSV for Russell validation')
        return false
      }

      // Check if any row contains valid Russell index data
      // We don't require ALL rows to be valid, just that there's at least one good Russell row
      const hasValidRussellData = parsed.some(
        (row) =>
          row &&
          row.length >= EXPECTED_COLUMNS && // Must have sufficient columns
          row[INDEX_NAME_COLUMN] &&
          String(row[INDEX_NAME_COLUMN]).includes('Russell') &&
          (String(row[INDEX_NAME_COLUMN]).includes('®') ||
            String(row[INDEX_NAME_COLUMN]).includes('�')),
      )

      if (!hasValidRussellData) {
        console.error('No valid Russell index data found in CSV validation')
        console.error(
          'Available data in first column:',
          parsed
            .slice(0, 5)
            .map((row) => row[INDEX_NAME_COLUMN])
            .filter(Boolean),
        )
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Normalize a string by removing the ® symbol
   */
  normalizeString(str: string): string {
    return str.replace(/®/g, '').trim()
  }
}
