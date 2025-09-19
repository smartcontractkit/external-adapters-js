import fs from 'fs'
import path from 'path'
import { FileInfo } from 'ssh2-sftp-client'

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

export const ftseFilename = 'ukallv0209.csv'
export const russellFilename = 'daily_values_russell_250827.CSV'

export const ftseDirectory = '/data/valuation/uk_all_share/'
export const russellDirectory =
  '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/'

export const fileContents: Record<string, string> = {
  [path.join(ftseDirectory, ftseFilename)]: ftseCsvFixture,
  [path.join(russellDirectory, russellFilename)]: russellCsvFixture,
}

export const directoryListings = {
  [ftseDirectory]: [
    'vall_icb2302.csv',
    'vall1809.csv',
    'valllst.csv',
    ftseFilename,
    'ukallvlst.csv',
    'vall_icb2302_v1.csv',
  ].map((name) => ({ name })),
  [russellDirectory]: ['history', russellFilename].map((name) => ({ name })),
} as unknown as Record<string, FileInfo[]>
