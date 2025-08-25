import { CSVParser } from './interfaces'
import { FTSE100Parser } from './ftse100'
import { FTSE250Parser } from './ftse250'

/**
 * Supported CSV parser types
 */
export enum CSVParserType {
  FTSE100 = 'ftse100',
  FTSE250 = 'ftse250'
}

/**
 * Factory class for creating CSV parsers
 */
export class CSVParserFactory {
  /**
   * Create a parser instance based on the specified type
   */
  static createParser(type: CSVParserType): CSVParser {
    switch (type) {
      case CSVParserType.FTSE100:
        return new FTSE100Parser()
      
      case CSVParserType.FTSE250:
        return new FTSE250Parser()
      
      default:
        throw new Error(`Unsupported parser type: ${type}`)
    }
  }

  /**
   * Auto-detect parser type based on CSV content
   * Returns the first parser that validates the format
   */
  static detectParser(csvContent: string): CSVParser | null {
    const parsers = [
      new FTSE100Parser(),
      new FTSE250Parser()
    ]

    for (const parser of parsers) {
      if (parser.validateFormat(csvContent)) {
        return parser
      }
    }

    return null
  }

  /**
   * Auto-detect parser type based on filename
   */
  static detectParserByFilename(filename: string): CSVParser | null {
    const lowercaseFilename = filename.toLowerCase()

    if (lowercaseFilename.includes('ftse100') || lowercaseFilename.includes('ftse_100')) {
      return new FTSE100Parser()
    }
    
    if (lowercaseFilename.includes('ftse250') || lowercaseFilename.includes('ftse_250')) {
      return new FTSE250Parser()
    }

    return null
  }

  /**
   * Get all available parser types
   */
  static getAvailableTypes(): CSVParserType[] {
    return Object.values(CSVParserType)
  }
}
