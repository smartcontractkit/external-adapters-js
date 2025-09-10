import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

// Column names for Russell CSV format
// The first column contains the index names but doesn't have a consistent header
// We'll use the first column (index 0) directly instead of relying on column names
const HEADER_ROW_NUMBER = 5
const INDEX_NAME_COLUMN = 0
const CLOSE_VALUE_COLUMN = 4

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
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"',
      relax_column_count: true,
    })
    this.instrument = instrument
  }

  async parse(csvContent: string): Promise<RussellDailyValuesData> {
    try {
      this.validateCloseColumn(csvContent)
    } catch (error: any) {
      throw new Error(`Invalid CSV structure: ${error.message}`)
    }

    const parsed = this.parseCSV(csvContent, {
      from_line: HEADER_ROW_NUMBER + 1, // Skip header line, + 1 because columns: false and we don't have a haeder row
      columns: false,
    })

    const results: RussellDailyValuesData[] = parsed
      .filter((row: any[]) => {
        return row[INDEX_NAME_COLUMN] === this.instrument
      })
      .map((row: any[]) => this.createRussellData(row))

    if (results.length === 0) {
      throw new Error('No matching Russell index records found')
    } else if (results.length > 1) {
      throw new Error('Multiple matching Russell index records found, expected only one')
    }

    return results[0]
  }

  /**
   * Validates that the CLOSE_VALUE_COLUMN index corresponds to the "Close" header
   */
  private validateCloseColumn(csvContent: string): void {
    const lines = csvContent.split('\n')

    if (lines.length <= HEADER_ROW_NUMBER) {
      throw new Error(
        `CSV content does not have enough lines to validate header row at line ${
          HEADER_ROW_NUMBER + 1
        }`,
      )
    }

    const headerLine = lines[HEADER_ROW_NUMBER]
    const headers = headerLine.split(',').map((header) => header.trim().replace(/"/g, ''))

    if (headers.length <= CLOSE_VALUE_COLUMN) {
      throw new Error(
        `Header row does not have enough columns. Expected at least ${
          CLOSE_VALUE_COLUMN + 1
        } columns`,
      )
    }

    const closeHeader = headers[CLOSE_VALUE_COLUMN]
    if (closeHeader.toLowerCase() !== 'close') {
      throw new Error(
        `Expected "Close" column at index ${CLOSE_VALUE_COLUMN}, but found "${closeHeader}"`,
      )
    }
  }

  /**
   * Creates RussellDailyValuesData object from a CSV row array
   */
  private createRussellData(row: any[]): RussellDailyValuesData {
    const indexName = row[INDEX_NAME_COLUMN]
    const closeValue = row[CLOSE_VALUE_COLUMN]

    if (!indexName || (typeof indexName === 'string' && indexName.trim() === '')) {
      throw new Error(`Empty values found in required columns: Index Name`)
    }

    if (
      closeValue === null ||
      closeValue === undefined ||
      closeValue === '' ||
      (typeof closeValue === 'string' && closeValue.trim() === '')
    ) {
      throw new Error(`Empty values found in required columns: Close`)
    }

    return {
      indexName: indexName,
      close: this.convertToNumber(closeValue),
    }
  }
}
