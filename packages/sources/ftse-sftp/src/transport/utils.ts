export const instrumentToFileTemplateMap: Record<string, string> = {
  FTSE100INDEX: '/data/valuation/uk_all_share/ukallv{{dd}}{{mm}}.csv',
  Russell1000INDEX:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell2000INDEX:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell3000INDEX:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
}
