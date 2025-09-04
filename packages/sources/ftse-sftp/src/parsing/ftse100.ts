import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

/**
 * Specific data structure for FTSE data
 * Based on the actual FTSE CSV format with Index Code, Index/Sector Name, Number of Constituents, Index Base Currency, GBP Index
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
    })
  }

  async parse(csvContent: string): Promise<FTSE100Data[]> {
    if (!this.validateFormat(csvContent)) {
      throw new Error('Invalid CSV format for FTSE data')
    }

    const parsed = this.parseCSV(csvContent, {
      from_line: 4, // Start parsing from line 4 (includes header)
      relax_column_count: true, // Allow rows with different column counts
    })
    const results: FTSE100Data[] = []

    for (const row of parsed) {
      try {
        // Only include records where indexCode is "UKX" (FTSE 100 Index)
        if (row['Index Code'] === 'UKX') {
          const data: FTSE100Data = {
            indexCode: this.convertValue(row['Index Code'], 'string') as string,
            indexSectorName: this.convertValue(row['Index/Sector Name'], 'string') as string,
            numberOfConstituents: this.convertValue(row['Number of Constituents'], 'number') as
              | number
              | null,
            indexBaseCurrency: this.convertValue(row['Index Base Currency'], 'string') as string,
            gbpIndex: this.convertValue(row['GBP Index'], 'number') as number | null,
          }

          // Additional validation for required fields
          if (!data.indexCode || data.indexCode === '') {
            console.warn(`Missing required Index Code field`)
            continue
          }

          results.push(data)
        }
      } catch (error) {
        console.debug(`Error parsing row:`, error)
      }
    }

    return results
  }

  /**
   * Enhanced validation specific to FTSE format
   */
  validateFormat(csvContent: string): boolean {
    if (!csvContent || csvContent.trim().length === 0) {
      return false
    }

    try {
      // Parse from line 4 (header) to line 6 to validate the format
      const parsed = this.parseCSV(csvContent, {
        from_line: 4,
        to_line: 6, // Parse header and a couple data rows for validation
        relax_column_count: true,
      })

      if (!parsed || parsed.length === 0) {
        return false
      }

      // Check if we can access the expected columns from the first data row
      const firstDataRow = parsed[0]
      return (
        firstDataRow &&
        firstDataRow['Index Code'] !== undefined &&
        firstDataRow['GBP Index'] !== undefined
      )
    } catch (error) {
      return false
    }
  }
}
