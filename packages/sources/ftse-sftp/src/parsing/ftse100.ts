import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

/**
 * Spreadsheet consts
 */
const FTSE_100_INDEX_CODE = 'UKX'
const FTSE_INDEX_CODE_COLUMN = 'Index Code'
const FTSE_INDEX_SECTOR_NAME_COLUMN = 'Index/Sector Name'
const FTSE_NUMBER_OF_CONSTITUENTS_COLUMN = 'Number of Constituents'
const FTSE_INDEX_BASE_CURRENCY_COLUMN = 'Index Base Currency'
const FTSE_GBP_INDEX_COLUMN = 'GBP Index'
const FIRST_DATA_ROW = 4 // Start from header line (line 4)

/**
 * Specific data structure for FTSE data
 * Based on the actual FTSE CSV format with Index Code, Index/Sector Name, Number of Constituents, Index Base Currency, and GBP Index
 */
export interface FTSE100Data extends ParsedData {
  indexCode: string
  indexSectorName: string
  numberOfConstituents: number | null
  indexBaseCurrency: string
  gbpIndex: number | null
}

/**
 * CSV Parser for FTSE format
 * Expects columns: Index Code, Index/Sector Name, Number of Constituents, Index Base Currency, GBP Index
 */
export class FTSE100Parser extends BaseCSVParser {
  constructor() {
    super({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"',
      relax_column_count: true, // Allow rows with different number of columns
    })
  }

  async parse(csvContent: string): Promise<FTSE100Data[]> {
    const parsed = this.parseCSV(csvContent, {
      from_line: FIRST_DATA_ROW, // Start parsing from line 5 (includes header)
    })

    const results: FTSE100Data[] = parsed
      .filter((row) => {
        return row[FTSE_INDEX_CODE_COLUMN] === FTSE_100_INDEX_CODE
      })
      .map((row) => this.createFTSE100Data(row))

    if (results.length > 1) {
      throw new Error('Multiple FTSE 100 index records found, expected only one')
    } else if (results.length === 0) {
      throw new Error('No FTSE 100 index record found')
    }

    return results
  }

  /**
   * Creates FTSE100Data object from a CSV row
   */
  private createFTSE100Data(row: any): FTSE100Data {
    // Validate that all required columns are present in the row
    const requiredColumns = [
      FTSE_INDEX_CODE_COLUMN,
      FTSE_INDEX_SECTOR_NAME_COLUMN,
      FTSE_NUMBER_OF_CONSTITUENTS_COLUMN,
      FTSE_INDEX_BASE_CURRENCY_COLUMN,
      FTSE_GBP_INDEX_COLUMN,
    ]

    const missingColumns = requiredColumns.filter((column) => row[column] === undefined)
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns in row: ${missingColumns.join(', ')}`)
    }

    return {
      indexCode: this.convertValue(row[FTSE_INDEX_CODE_COLUMN], 'string') as string,
      indexSectorName: this.convertValue(row[FTSE_INDEX_SECTOR_NAME_COLUMN], 'string') as string,
      numberOfConstituents: this.convertValue(row[FTSE_NUMBER_OF_CONSTITUENTS_COLUMN], 'number') as
        | number
        | null,
      indexBaseCurrency: this.convertValue(
        row[FTSE_INDEX_BASE_CURRENCY_COLUMN],
        'string',
      ) as string,
      gbpIndex: this.convertValue(row[FTSE_GBP_INDEX_COLUMN], 'number') as number | null,
    }
  }
}
