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
  private readonly expectedColumns = [
    'Index Code',
    'Index/Sector Name',
    'Number of Constituents',
    'Index Base Currency',
    'USD Index',
    'GBP Index',
    'EUR Index',
    'JPY Index',
    'AUD Index',
    'CNY Index',
    'HKD Index',
    'CAD Index',
    'LOC Index',
    'Base Currency (GBP) Index',
  ]

  private readonly fieldMapping = {
    indexCode: { column: 'Index Code', type: 'string' as const },
    indexSectorName: { column: 'Index/Sector Name', type: 'string' as const },
    numberOfConstituents: { column: 'Number of Constituents', type: 'number' as const },
    indexBaseCurrency: { column: 'Index Base Currency', type: 'string' as const },
    gbpIndex: { column: 'GBP Index', type: 'number' as const },
  }

  constructor() {
    // FTSE data is tab-separated based on the actual file format
    super({
      delimiter: '\t',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  }

  getExpectedColumns(): string[] {
    return this.expectedColumns
  }

  async parse(csvContent: string): Promise<FTSE100Data[]> {
    if (!this.validateFormat(csvContent)) {
      throw new Error('Invalid CSV format for FTSE data')
    }

    // Find the line that starts with "Index Code" to locate the actual data header
    const lines = csvContent.split(/\r?\n/)
    let dataStartIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('Index Code')) {
        dataStartIndex = i
        break
      }
    }

    if (dataStartIndex === -1) {
      throw new Error('Could not find data header line starting with "Index Code"')
    }

    // Extract the content starting from the header line
    const csvDataContent = lines.slice(dataStartIndex).join('\n')

    // Parse the CSV content using csv-parse with relaxed column checking
    const parsed = this.parseCSV(csvDataContent, {
      relax_column_count: true, // Allow rows with different column counts
    })
    const results: FTSE100Data[] = []

    for (const row of parsed) {
      try {
        // Only include records where indexCode is "UKX" (FTSE 100 Index)
        if (row['Index Code'] === 'UKX') {
          const data = this.mapRowToObject(row, this.fieldMapping) as FTSE100Data

          // Additional validation for required fields
          if (!data.indexCode || data.indexCode === '') {
            console.warn(`Missing required Index Code field`)
            continue
          }

          results.push(data)
        }
      } catch (error) {
        console.debug(`Error parsing row:`, error)
        // Continue with next row instead of failing completely
      }
    }

    return results
  }

  /**
   * Enhanced validation specific to FTSE format
   */
  validateFormat(csvContent: string): boolean {
    // Skip the base validation since our header is not on the first line
    if (!csvContent || csvContent.trim().length === 0) {
      return false
    }

    // Check if the content contains FTSE-specific headers
    return csvContent.includes('Index Code') && csvContent.includes('GBP Index')
  }

  /**
   * Get only the essential fields you specified
   */
  getEssentialData(data: FTSE100Data[]): Array<{
    indexCode: string
    indexSectorName: string
    numberOfConstituents: number | null
    indexBaseCurrency: string
    gbpIndex: number | null
  }> {
    return data.map((item) => ({
      indexCode: item.indexCode,
      indexSectorName: item.indexSectorName,
      numberOfConstituents: item.numberOfConstituents,
      indexBaseCurrency: item.indexBaseCurrency,
      gbpIndex: item.gbpIndex,
    }))
  }
}
