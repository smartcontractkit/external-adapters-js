import fs from 'fs'
import path from 'path'

// Read the actual CSV files
export const ftseCsvFixture = fs.readFileSync(path.join(__dirname, 'ftse100.csv'), 'utf8')

export const russellCsvFixture = fs.readFileSync(
  path.join(__dirname, 'daily_russell_values.CSV'),
  'utf8',
)

// FTSE test data helper functions
export const createFTSETestData = (dataRows: string[]): string => {
  const header = `02/09/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index,USD TRI,GBP TRI,EUR TRI,JPY TRI,AUD TRI,CNY TRI,HKD TRI,CAD TRI,LOC TRI,Base Currency (GBP) TRI,Mkt Cap (USD),Mkt Cap (GBP),Mkt Cap (EUR),Mkt Cap (JPY),Mkt Cap (AUD),Mkt Cap (CNY),Mkt Cap (HKD),Mkt Cap (CAD),Mkt Cap (LOC),Mkt Cap Base Currency (GBP),XD Adjustment (YTD),Dividend Yield`

  return header + '\n' + dataRows.join('\n')
}

export const ftseDataRows = {
  ftse100:
    'UKX,FTSE 100 Index,100,GBP,4659.89,4926.96924528,4408.59,2906.09,6285.86,10105.19,4556.30,5034.13,,4926.96924528,10366.46,11241.47,10058.74,6630.59,14341.94,23056.20,10395.76,11485.98,,11241.47,3409451.98,2547028.23,2924058.31,505280784.11,5229220.84,24337691.10,26610772.74,4701293.34,,2547028.23,131.517,3.39%',
  allSmall:
    'AS0,FTSE All-Small Index,234,GBP,4535.82,4918.68,4401.18,2901.20,6275.28,10088.19,4548.64,5025.67,,4918.68,10833.23,11747.64,10511.66,6929.15,14987.71,24094.35,10863.85,12003.16,,11747.64,51838.35,38725.80,44458.28,7682443.59,79506.67,370037.70,404598.33,71479.90,,38725.80,126.988,3.97%',
}

// Russell test data helper functions
export const createRussellTestData = (dataRows: string[]): string => {
  const header = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"`

  return header + '\n' + dataRows.join('\n')
}

export const russellDataRows = {
  russell1000:
    'Russell 1000® Index,3538.25,3550.79,3534.60,3547.40,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28',
  russell2000:
    'Russell 2000® Index,2358.60,2375.71,2352.78,2373.80,15.20,0.64,2373.80,2274.10,104.45,4.60,2442.03,1760.71,185.16,8.46',
  russell3000:
    'Russell 3000® Index,3680.78,3694.23,3676.84,3690.93,10.14,0.28,3690.93,3620.34,58.02,1.60,3690.93,2826.03,506.36,15.90',
}
