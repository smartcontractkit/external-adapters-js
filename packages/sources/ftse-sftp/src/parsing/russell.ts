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
  private readonly expectedColumns = [
    '', // Index name column (no header)
    'Open',
    'High',
    'Low',
    'Close',
  ]

  private readonly fieldMapping = {
    indexName: { index: 0, type: 'string' as const },
    close: { index: 4, type: 'number' as const },
  }

  constructor() {
    // Russell daily values data appears to be tab-separated
    super({
      delimiter: '\t',
      hasHeader: false, // The data format has complex headers that we'll skip
      skipEmptyLines: true,
      trimWhitespace: true,
    })
  }

  getExpectedColumns(): string[] {
    return this.expectedColumns
  }

  async parse(csvContent: string): Promise<RussellDailyValuesData[]> {
    const lines = this.splitIntoLines(csvContent)
    const results: RussellDailyValuesData[] = []

    // Find the start of actual data - look for lines that start with "Russell"
    let dataStartIndex = -1
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('Russell') && line.includes('®')) {
        dataStartIndex = i
        break
      }
    }

    if (dataStartIndex === -1) {
      throw new Error('Could not find Russell index data in the provided content')
    }

    // Parse data lines starting from the identified index
    for (let i = dataStartIndex; i < lines.length; i++) {
      try {
        const line = lines[i].trim()

        // Skip empty lines or lines that don't contain Russell data
        if (!line || !line.startsWith('Russell')) {
          continue
        }

        const fields = this.parseLine(line)

        if (fields.length < 5) {
          // Minimum required fields (indexName, open, high, low, close)
          console.warn(`Line ${i + 1}: Expected at least 5 fields, got ${fields.length}`)
          continue
        }

        const data = this.mapFieldsToObject(fields, this.fieldMapping) as RussellDailyValuesData

        // Additional validation for required fields
        if (!data.indexName || data.indexName === '') {
          console.warn(`Line ${i + 1}: Missing required index name field`)
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
   * Enhanced validation specific to Russell Daily Values format
   */
  validateFormat(csvContent: string): boolean {
    if (!super.validateFormat(csvContent)) {
      return false
    }

    // Check if the content contains Russell index data
    return csvContent.includes('Russell') && csvContent.includes('®')
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
}
