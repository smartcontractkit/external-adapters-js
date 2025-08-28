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
    const lines = csvContent.split(/\r?\n/)
    const results: RussellDailyValuesData[] = []

    // Find the start of actual data - look for lines that start with "Russell" and contain '®' or '�'
    const dataLines = lines.filter((line) => {
      const trimmed = line.trim()
      // Accept both '®' and '�' as the symbol in the index name
      // Also handle quoted fields that start with "Russell
      return (
        (trimmed.startsWith('Russell') || trimmed.startsWith('"Russell')) &&
        (trimmed.includes('®') || trimmed.includes('�'))
      )
    })

    if (dataLines.length === 0) {
      throw new Error('Could not find Russell index data in the provided content')
    }

    for (const line of dataLines) {
      try {
        // Parse a single line as CSV (comma-separated)
        const parsed = this.parseCSV(line, { columns: false })

        if (!parsed || parsed.length === 0 || !parsed[0] || parsed[0].length < 5) {
          console.warn(`Skipping line with insufficient fields: ${line.substring(0, 100)}`)
          continue
        }

        const fields = parsed[0]

        // Remove quotes if present in index name
        let indexName = this.convertValue(fields[0], 'string') as string
        if (indexName && indexName.startsWith('"') && indexName.endsWith('"')) {
          indexName = indexName.slice(1, -1)
        }

        const data: RussellDailyValuesData = {
          indexName,
          close: this.convertValue(fields[4], 'number') as number | null,
        }

        // Additional validation for required fields
        if (!data.indexName || data.indexName === '') {
          console.warn(`Missing required index name field in line: ${line.substring(0, 100)}`)
          continue
        }

        // Normalize the string because of the ® symbol
        if (this.normalizeString(indexName) === this.normalizeString(this.instrument)) {
          results.push(data)
        }
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
    // Check if the content contains Russell index data (accept both '®' and '�')
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

  /**
   * Normalize a string by removing unwanted characters
   */
  normalizeString(str: string): string {
    return str.replace(/[^\w\s]/g, '').trim()
  }
}
