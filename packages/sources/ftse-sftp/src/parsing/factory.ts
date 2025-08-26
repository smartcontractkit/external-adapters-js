import { CSVParser } from './interfaces'
import { FTSE100Parser } from './ftse100'
import { RussellDailyValuesParser } from './russell'

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
   * Auto-detect parser type based on filename
   */
  static detectParserByFilename(filename: string): CSVParser | null {
    const lowercaseFilename = filename.toLowerCase()

    if (lowercaseFilename.includes('ukallv')) {
      return new FTSE100Parser()
    }

    if (lowercaseFilename.includes('daily_values_russell')) {
      return new RussellDailyValuesParser()
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
