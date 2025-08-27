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
    indexCode: { index: 0, type: 'string' as const },
    indexSectorName: { index: 1, type: 'string' as const },
    numberOfConstituents: { index: 2, type: 'number' as const },
    indexBaseCurrency: { index: 3, type: 'string' as const },
    gbpIndex: { index: 5, type: 'number' as const }, // GBP Index is at index 5
  }

  constructor() {
    // FTSE data is tab-separated based on the actual file format
    super({
      delimiter: '\t',
      hasHeader: true,
      skipEmptyLines: true,
      trimWhitespace: true,
    })
  }

  getExpectedColumns(): string[] {
    return this.expectedColumns
  }

  async parse(csvContent: string): Promise<FTSE100Data[]> {
    if (!this.validateFormat(csvContent)) {
      throw new Error('Invalid CSV format for FTSE data')
    }

    const lines = this.splitIntoLines(csvContent)
    const results: FTSE100Data[] = []

    // Find the line that starts with "Index Code" to locate the actual data header
    let dataStartIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('Index Code')) {
        dataStartIndex = i + 1 // Start after the header line
        break
      }
    }

    if (dataStartIndex === -1) {
      throw new Error('Could not find data header line starting with "Index Code"')
    }

    for (let i = dataStartIndex; i < lines.length; i++) {
      try {
        const line = lines[i]
        if (!line.trim()) continue // Skip empty lines

        const fields = this.parseLine(line)

        // Skip lines that don't have enough fields (likely continuation of header or invalid data)
        if (fields.length < 6) {
          console.warn(
            `Line ${
              i + 1
            }: Skipping line with insufficient fields. Expected at least 6 fields (Index Code, Index/Sector Name, Number of Constituents, Index Base Currency, USD Index, GBP Index), got ${
              fields.length
            }. Line content: "${line.substring(0, 100)}${line.length > 100 ? '...' : ''}"`,
          )
          continue
        }

        const data = this.mapFieldsToObject(fields, this.fieldMapping) as FTSE100Data

        // Additional validation for required fields
        if (!data.indexCode || data.indexCode === '') {
          console.warn(`Line ${i + 1}: Missing required Index Code field`)
          continue
        }

        // Add all valid records (remove UKX filter for testing)
        results.push(data)
      } catch (error) {
        console.debug(`Error parsing line ${i + 1}:`, error)
        // Continue with next line instead of failing completely
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

    const lines = this.splitIntoLines(csvContent)
    if (lines.length === 0) {
      return false
    }

    // Find the header line that starts with "Index Code"
    let headerLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('Index Code')) {
        headerLineIndex = i
        break
      }
    }

    if (headerLineIndex === -1) {
      return false
    }

    const headerLine = lines[headerLineIndex]
    const headers = this.parseLine(headerLine)

    // Check if required columns are present
    const requiredColumns = [
      'Index Code',
      'Index/Sector Name',
      'Number of Constituents',
      'Index Base Currency',
      'GBP Index',
    ]
    return requiredColumns.every((col) =>
      headers.some((header) => header.toLowerCase().includes(col.toLowerCase())),
    )
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
