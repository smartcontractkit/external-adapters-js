export const instrumentToFilePathMap: Record<string, string> = {
  FTSE100INDEX: '/data/valuation/uk_all_share/',
  Russell1000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  Russell2000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  Russell3000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
}

export const instrumentToFileTemplateMap: Record<string, string> = {
  FTSE100INDEX: 'ukallv*.csv',
  Russell1000INDEX: 'daily_values_russell_*.CSV',
  Russell2000INDEX: 'daily_values_russell_*.CSV',
  Russell3000INDEX: 'daily_values_russell_*.CSV',
}

export const instrumentToFileRegexMap: Record<string, RegExp> = {
  FTSE100INDEX: /^ukallv\d{4}\.csv$/,
  Russell1000INDEX: /^daily_values_russell_\d{6}\.CSV$/,
  Russell2000INDEX: /^daily_values_russell_\d{6}\.CSV$/,
  Russell3000INDEX: /^daily_values_russell_\d{6}\.CSV$/,
}
