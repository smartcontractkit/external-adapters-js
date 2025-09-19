import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const instrumentToDirectoryMap: Record<string, string> = {
  FTSE100INDEX: '/data/valuation/uk_all_share/',
  Russell1000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  Russell2000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  Russell3000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
}

export const instrumentToFileRegexMap: Record<string, RegExp> = {
  FTSE100INDEX: /^ukallv\d{4}\.csv$/,
  Russell1000INDEX: /^daily_values_russell_\d{6}\.CSV$/,
  Russell2000INDEX: /^daily_values_russell_\d{6}\.CSV$/,
  Russell3000INDEX: /^daily_values_russell_\d{6}\.CSV$/,
}

/**
 * Validates if an instrument is supported by checking if it has all required mappings
 * @param instrument The instrument identifier to validate
 * @returns true if the instrument is supported, false otherwise
 */
const isInstrumentSupported = (instrument: string): boolean => {
  return !!(instrumentToDirectoryMap[instrument] && instrumentToFileRegexMap[instrument])
}

export const validateInstrument = (instrument: string): void => {
  if (!isInstrumentSupported(instrument)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Unsupported instrument: ${instrument}`,
    })
  }
}
