import { CSVParser } from './interfaces'
import { FTSE100Parser } from './ftse100'
import { RussellParser } from './russell'

/**
 * Supported CSV parser types
 */
export enum CSVParserType {
  FTSE100 = 'ftse100',
  Russell1000INDEX = 'russell1000',
  Russell2000INDEX = 'russell2000',
  Russell3000INDEX = 'russell3000',
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
      case CSVParserType.Russell1000INDEX:
        return new RussellParser()
      case CSVParserType.Russell2000INDEX:
        return new RussellParser()
      case CSVParserType.Russell3000INDEX:
        return new RussellParser()
      default:
        throw new Error(`Unsupported parser type: ${type}`)
    }
  }

  /**
   * Auto-detect parser type based on CSV content
   * Returns the first parser that validates the format
   */
  static detectParser(csvContent: string): CSVParser | null {
    const parsers = [new FTSE100Parser()]

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

    if (lowercaseFilename.includes('vall')) {
      return new FTSE100Parser()
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
