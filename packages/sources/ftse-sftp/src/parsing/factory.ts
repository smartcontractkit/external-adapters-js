import { CSVParser } from './interfaces'
import { FTSE100Parser } from './ftse100'
import { RussellDailyValuesParser } from './russell'

/**
 * Supported CSV parser types
 */
export const instrumentToElementMap = {
  Russell1000INDEX: 'Russell 1000® Index',
  Russell2000INDEX: 'Russell 2000® Index',
  Russell3000INDEX: 'Russell 3000® Index',
}

/**
 * Factory class for creating CSV parsers
 */
export class CSVParserFactory {
  /**
   * Auto-detect parser type based on instrument
   */
  static detectParserByInstrument(instrument: string): CSVParser | null {
    switch (instrument) {
      case 'FTSE100INDEX':
        return new FTSE100Parser()
      case 'Russell1000INDEX':
        return new RussellDailyValuesParser(instrumentToElementMap[instrument])
      case 'Russell2000INDEX':
        return new RussellDailyValuesParser(instrumentToElementMap[instrument])
      case 'Russell3000INDEX':
        return new RussellDailyValuesParser(instrumentToElementMap[instrument])
      default:
        return null
    }
  }
}
