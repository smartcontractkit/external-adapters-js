import { Instrument } from '../endpoint/sftp'

export const FTSE100INDEX: Instrument = 'FTSE100INDEX'
export const RUSSELL_1000_INDEX: Instrument = 'Russell1000INDEX'
export const RUSSELL_2000_INDEX: Instrument = 'Russell2000INDEX'
export const RUSSELL_3000_INDEX: Instrument = 'Russell3000INDEX'

export const instrumentToDirectoryMap: Record<Instrument, string> = {
  [FTSE100INDEX]: '/data/valuation/uk_all_share/',
  [RUSSELL_1000_INDEX]:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  [RUSSELL_2000_INDEX]:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  [RUSSELL_3000_INDEX]:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
}

export const instrumentToFileRegexMap: Record<Instrument, RegExp> = {
  [FTSE100INDEX]: /^ukallv\d{4}\.csv$/,
  [RUSSELL_1000_INDEX]: /^daily_values_russell_\d{6}\.CSV$/,
  [RUSSELL_2000_INDEX]: /^daily_values_russell_\d{6}\.CSV$/,
  [RUSSELL_3000_INDEX]: /^daily_values_russell_\d{6}\.CSV$/,
}
