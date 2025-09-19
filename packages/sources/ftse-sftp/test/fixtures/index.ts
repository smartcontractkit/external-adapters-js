import fs from 'fs'
import path from 'path'

// Helper function to read fixture files
export function readFixtureFile(filename: string): string {
  return fs.readFileSync(path.join(__dirname, filename), 'latin1')
}

// Raw CSV fixture data
export const ftseCsvFixture = readFixtureFile('ftse100.csv')
export const russellCsvFixture = readFixtureFile('daily_russell_values.CSV')

// Expected parsed results for testing
export const expectedFtseData = {
  indexCode: 'UKX',
  indexSectorName: 'FTSE 100 Index',
  numberOfConstituents: 100,
  indexBaseCurrency: 'GBP',
  gbpIndex: 9116.68749114,
}

export const expectedRussellData = {
  indexName: 'Russell 1000® Index',
  close: 3547.4,
}

// Test data generation helpers
export const createFTSETestData = (dataRows: string[]): string => {
  const header = `02/09/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index,USD TRI,GBP TRI,EUR TRI,JPY TRI,AUD TRI,CNY TRI,HKD TRI,CAD TRI,LOC TRI,Base Currency (GBP) TRI,Mkt Cap (USD),Mkt Cap (GBP),Mkt Cap (EUR),Mkt Cap (JPY),Mkt Cap (AUD),Mkt Cap (CNY),Mkt Cap (HKD),Mkt Cap (CAD),Mkt Cap (LOC),Mkt Cap Base Currency (GBP),XD Adjustment (YTD),Dividend Yield`

  return header + '\n' + dataRows.join('\n')
}

export const createRussellTestData = (dataRows: string[]): string => {
  const header = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"`

  return header + '\n' + dataRows.join('\n')
}
