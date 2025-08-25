import { CSVParser, ParsedData, CSVParserConfig, defaultCSVConfig } from './interfaces'

/**
 * Abstract base class for CSV parsers
 * Provides common functionality that can be shared across different CSV formats
 */
export abstract class BaseCSVParser implements CSVParser {
  protected config: CSVParserConfig

  constructor(config: Partial<CSVParserConfig> = {}) {
    this.config = { ...defaultCSVConfig, ...config }
  }

  /**
   * Abstract method that must be implemented by concrete classes
   */
  abstract parse(csvContent: string): Promise<ParsedData[]>

  /**
   * Abstract method that must be implemented by concrete classes
   */
  abstract getExpectedColumns(): string[]

  /**
   * Default validation - checks if content is not empty and has expected structure
   * Can be overridden by concrete classes for specific validation logic
   */
  validateFormat(csvContent: string): boolean {
    if (!csvContent || csvContent.trim().length === 0) {
      return false
    }

    const lines = this.splitIntoLines(csvContent)
    if (lines.length === 0) {
      return false
    }

    // If has header, check if header matches expected columns
    if (this.config.hasHeader) {
      const headerLine = lines[0]
      const headers = this.parseLine(headerLine)
      const expectedColumns = this.getExpectedColumns()
      
      // Basic check - at least some expected columns should be present
      return expectedColumns.some(col => headers.includes(col))
    }

    return true
  }

  /**
   * Split CSV content into lines, handling different line endings
   */
  protected splitIntoLines(csvContent: string): string[] {
    const lines = csvContent.split(/\r?\n/)
    
    if (this.config.skipEmptyLines) {
      return lines.filter(line => line.trim().length > 0)
    }
    
    return lines
  }

  /**
   * Parse a single CSV line into fields
   */
  protected parseLine(line: string): string[] {
    const delimiter = this.config.delimiter || ','
    const fields: string[] = []
    let currentField = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"'
          i += 2
          continue
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        fields.push(this.config.trimWhitespace ? currentField.trim() : currentField)
        currentField = ''
      } else {
        currentField += char
      }

      i++
    }

    // Add the last field
    fields.push(this.config.trimWhitespace ? currentField.trim() : currentField)
    
    return fields
  }

  /**
   * Convert a string value to appropriate type
   */
  protected convertValue(value: string, expectedType: 'string' | 'number' | 'date' = 'string'): string | number | Date | null {
    if (!value || value.trim() === '') {
      return null
    }

    const trimmedValue = value.trim()

    switch (expectedType) {
      case 'number':
        const numValue = parseFloat(trimmedValue.replace(/,/g, ''))
        return isNaN(numValue) ? null : numValue

      case 'date':
        const dateValue = new Date(trimmedValue)
        return isNaN(dateValue.getTime()) ? null : dateValue

      case 'string':
      default:
        return trimmedValue
    }
  }

  /**
   * Map CSV fields to an object using a field mapping
   */
  protected mapFieldsToObject(fields: string[], fieldMapping: Record<string, { index: number; type?: 'string' | 'number' | 'date' }>): ParsedData {
    const result: ParsedData = {}

    for (const [key, mapping] of Object.entries(fieldMapping)) {
      const value = fields[mapping.index] || ''
      result[key] = this.convertValue(value, mapping.type || 'string')
    }

    return result
  }
}
