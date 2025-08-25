import { BaseCSVParser } from './base-parser'
import { ParsedData } from './interfaces'

/**
 * Specific data structure for FTSE data
 * Based on the actual FTSE CSV format with Index Code, No. Cons, Index (GBP), TRI (GBP)
 */
export interface FTSE100Data extends ParsedData {
  indexCode: string
  indexSectorName: string
  noCons: number | null
  indexGBP: number | null
  indexEUR: number | null
  triGBP: number | null
  triEUR: number | null
  xdAdjToday: number | null
  xdAdjYTD: number | null
  mcapGBP: number | null
  mcapEUR: number | null
  actualDivYld: number | null
  netCover: number | null
  peRatio: number | null
  indexPercentChg: number | null
  triPercentChg: number | null
  weightAllShare: number | null
}

/**
 * CSV Parser for FTSE format
 * Expects columns: Index Code, Index/Sector Name, No. Cons, Index (GBP), Index (EUR), TRI (GBP), etc.
 */
export class FTSE100Parser extends BaseCSVParser {
  private readonly expectedColumns = [
    'Index Code',
    'Index/Sector Name',
    'No. Cons',
    'Index (GBP)',
    'Index (EUR)',
    'TRI (GBP)',
    'TRI (EUR)',
    'XD adj today',
    'XD adj YTD',
    'Mcap (GBP)',
    'Mcap (EUR)',
    'Actual Div Yld',
    'Net Cover',
    'P/E Ratio',
    'Index % chg',
    'TRI % chg',
    '% wgt (All-share)'
  ]

  private readonly fieldMapping = {
    indexCode: { index: 0, type: 'string' as const },
    indexSectorName: { index: 1, type: 'string' as const },
    noCons: { index: 2, type: 'number' as const },
    indexGBP: { index: 3, type: 'number' as const },
    indexEUR: { index: 4, type: 'number' as const },
    triGBP: { index: 5, type: 'number' as const },
    triEUR: { index: 6, type: 'number' as const },
    xdAdjToday: { index: 7, type: 'number' as const },
    xdAdjYTD: { index: 8, type: 'number' as const },
    mcapGBP: { index: 9, type: 'number' as const },
    mcapEUR: { index: 10, type: 'number' as const },
    actualDivYld: { index: 11, type: 'number' as const },
    netCover: { index: 12, type: 'number' as const },
    peRatio: { index: 13, type: 'number' as const },
    indexPercentChg: { index: 14, type: 'number' as const },
    triPercentChg: { index: 15, type: 'number' as const },
    weightAllShare: { index: 16, type: 'number' as const }
  }

  constructor() {
    // FTSE data appears to be tab-separated based on the sample
    super({
      delimiter: '\t',
      hasHeader: true,
      skipEmptyLines: true,
      trimWhitespace: true
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

    // Skip header if present
    const startIndex = this.config.hasHeader ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      try {
        const line = lines[i]
        const fields = this.parseLine(line)

        if (fields.length < 4) { // Minimum required fields
          console.warn(`Line ${i + 1}: Expected at least 4 fields (Index Code, No. Cons, Index GBP, TRI GBP), got ${fields.length}`)
          continue
        }

        const data = this.mapFieldsToObject(fields, this.fieldMapping) as FTSE100Data

        // Additional validation for required fields
        if (!data.indexCode || data.indexCode === '') {
          console.warn(`Line ${i + 1}: Missing required Index Code field`)
          continue
        }

        results.push(data)
      } catch (error) {
        console.error(`Error parsing line ${i + 1}:`, error)
        // Continue with next line instead of failing completely
      }
    }

    return results
  }

  /**
   * Enhanced validation specific to FTSE format
   */
  validateFormat(csvContent: string): boolean {
    if (!super.validateFormat(csvContent)) {
      return false
    }

    const lines = this.splitIntoLines(csvContent)
    
    if (this.config.hasHeader) {
      const headerLine = lines[0]
      const headers = this.parseLine(headerLine)
      
      // Check if required columns are present
      const requiredColumns = ['Index Code', 'No. Cons', 'Index (GBP)', 'TRI (GBP)']
      return requiredColumns.every(col => 
        headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
      )
    }

    return true
  }

  /**
   * Get only the essential fields you specified
   */
  getEssentialData(data: FTSE100Data[]): Array<{
    indexCode: string,
    noCons: number | null,
    indexGBP: number | null,
    triGBP: number | null
  }> {
    return data.map(item => ({
      indexCode: item.indexCode,
      noCons: item.noCons,
      indexGBP: item.indexGBP,
      triGBP: item.triGBP
    }))
  }
}