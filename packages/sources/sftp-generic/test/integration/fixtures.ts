// Mock CSV file content for FTSE100INDEX
export const ftse100CsvContent = `Date,Open,High,Low,Close,Volume
2024-08-23,7500.00,7520.00,7485.00,7510.00,1000000
2024-08-22,7485.00,7505.00,7470.00,7500.00,950000
2024-08-21,7470.00,7490.00,7455.00,7485.00,900000`

// Mock CSV file content for Russell1000INDEX
export const russell1000CsvContent = `Date,Price,Volume,MarketCap
2024-08-23,2450.50,5000000,2500000000
2024-08-22,2440.25,4800000,2480000000
2024-08-21,2435.75,4600000,2460000000`

// Mock CSV file content for Russell2000INDEX
export const russell2000CsvContent = `Date,Price,Volume,MarketCap
2024-08-23,1950.50,3000000,1950000000
2024-08-22,1940.25,2800000,1940000000
2024-08-21,1935.75,2600000,1930000000`

// Mock CSV file content for Russell3000INDEX
export const russell3000CsvContent = `Date,Price,Volume,MarketCap
2024-08-23,2750.50,8000000,4450000000
2024-08-22,2740.25,7800000,4430000000
2024-08-21,2735.75,7600000,4410000000`

export const getExpectedFileName = (instrument: string, day: string, month: string) => {
  const fileNameMap = {
    'FTSE100INDEX': `vall${day}${month}.csv`,
    'Russell1000INDEX': `daily_values_russell_${day}${month}.csv`,
    'Russell2000INDEX': `daily_values_russell_${day}${month}.csv`,
    'Russell3000INDEX': `daily_values_russell_${day}${month}.csv`,
  }
  return fileNameMap[instrument as keyof typeof fileNameMap]
}

export const getCurrentDateFormatted = () => {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return { day, month }
}
