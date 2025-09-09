import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

// Column indices for Russell CSV format
const INDEX_NAME_COLUMN = 0
const CLOSE_VALUE_COLUMN = 4
const FIRST_DATA_ROW = 7

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
    // Russell data starts after the header rows, which vary in position
    // Parse the entire CSV and find Russell rows dynamically
    const parsed = this.parseCSV(csvContent, {
      from_line: FIRST_DATA_ROW, // Start parsing from line 7 (includes header)
      relax_column_count: true, // Allow rows with different number of columns
    })

    const results: RussellDailyValuesData[] = parsed
      .filter((row) => row.length > CLOSE_VALUE_COLUMN) // Keep rows with enough columns
      .map((row) => ({
        row,
        indexName: this.convertValue(row[INDEX_NAME_COLUMN], 'string') as string,
      }))
      .filter(({ indexName }) => indexName && indexName === this.instrument) // Only process rows that match the instrument
      .map(
        ({ row, indexName }): RussellDailyValuesData => ({
          indexName,
          close: this.convertValue(row[CLOSE_VALUE_COLUMN], 'number') as number | null,
        }),
      )

    if (results.length === 0) {
      throw new Error('No matching Russell index records found')
    } else if (results.length > 1) {
      throw new Error('Multiple matching Russell index records found, expected only one')
    }

    return results
  }
}
