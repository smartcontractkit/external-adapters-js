import fs from 'fs'
import path from 'path'

export function readFixtureFile(filename: string): string {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf-8')
}

export const ftseCsvFixture = readFixtureFile('ftse100.csv')
export const russellCsvFixture = readFixtureFile('daily_russell_values.CSV')

export const expectedFtseData = {
  indexCode: 'UKX',
  indexSectorName: 'FTSE 100 Index',
  numberOfConstituents: 100,
  indexBaseCurrency: 'GBP',
  gbpIndex: 9116.68749114,
}

export const expectedRussellData = {
  indexName: 'Russell 1000� Index',
  close: 3547.4,
}
