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
  private readonly instrument: string
  private readonly expectedColumns = [
    'Index Name', // We'll treat the index name as the first column
    'Open',
    'High',
    'Low',
    'Close',
  ]

  constructor(instrument: string) {
    // Russell daily values data is comma-separated in the actual file
    super({
      delimiter: ',',
      columns: false, // We'll handle the headers manually since they're complex
      skip_empty_lines: true,
      trim: true,
    })
    this.instrument = instrument
  }

  getExpectedColumns(): string[] {
    return this.expectedColumns
  }

  async parse(csvContent: string): Promise<RussellDailyValuesData[]> {
    const results: RussellDailyValuesData[] = []

    // Russell data always starts on line 7, so skip the first 6 lines
    // Use existing config (delimiter, trim, etc.) and just specify from_line
    const parsed = this.parseCSV(csvContent, {
      from_line: 7, // Start parsing from line
    })

    for (const row of parsed) {
      if (!row || row.length < 5) {
        continue // Skip rows with insufficient fields without logging
      }

      // Skip empty rows (where all fields are empty strings or just whitespace)
      const hasContent = row.some((field: any) => field && String(field).trim() !== '')
      if (!hasContent) {
        continue // Skip empty rows without logging
      }

      try {
        // Remove quotes if present in index name
        let indexName = this.convertValue(row[0], 'string') as string
        if (indexName && indexName.startsWith('"') && indexName.endsWith('"')) {
          indexName = indexName.slice(1, -1)
        }

        const data: RussellDailyValuesData = {
          indexName,
          close: this.convertValue(row[4], 'number') as number | null,
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
        // Continue with next row instead of failing completely
      }
    }

    // If no matching results were found but Russell data exists, that's still valid
    // Only throw error if no Russell data was found at all
    if (results.length === 0) {
      const hasRussellData = parsed.some(
        (row) => row && row[0] && String(row[0]).includes('Russell'),
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
      // Use existing config (delimiter, trim, etc.) and just specify from_line and to_line
      const parsed = this.parseCSV(csvContent, {
        from_line: 7,
        to_line: 10, // Only parse a few lines for validation
      })

      if (!parsed || parsed.length === 0) {
        return false
      }

      // Check if any row contains Russell index data
      return parsed.some(
        (row) =>
          row &&
          row[0] &&
          String(row[0]).includes('Russell') &&
          (String(row[0]).includes('®') || String(row[0]).includes('�')),
      )
    } catch (error) {
      return false
    }
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

  /**
   * Normalize a string by removing unwanted characters
   */
  normalizeString(str: string): string {
    return str.replace(/[^\w\s]/g, '').trim()
  }
}
