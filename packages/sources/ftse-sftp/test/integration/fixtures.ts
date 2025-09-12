// Mock SFTP data responses - simulating what would be returned after parsing CSV files
export const mockFtse100Response = {
  indexCode: 'UKX',
  indexSectorName: 'FTSE 100 Index',
  numberOfConstituents: 100,
  indexBaseCurrency: 'GBP',
  gbpIndex: 8045.12345678,
}

export const mockRussell1000Response = {
  indexName: 'Russell 1000® Index',
  close: 2654.123456,
}

export const mockRussell2000Response = {
  indexName: 'Russell 2000® Index',
  close: 1987.654321,
}

export const mockRussell3000Response = {
  indexName: 'Russell 3000® Index',
  close: 3456.789012,
}

// Raw CSV fixtures for transport testing
export const mockFtseCsvContent = `27/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index
UKX,FTSE 100 Index,100,GBP,4659.89484111,8045.12345678,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,8045.12345678
AS0,FTSE All-Small Index,234,GBP,4659.78333168,5017.12840249,4523.79182181,2963.39695263,6470.60416658,10384.22443471,4667.32711557,5177.24581174,,5017.12840249`

export const mockRussellCsvContent = `"Daily Values",,,,,,,,,,,,,,
,,,,,,,,,,,,,,
,,,,,,,,,,,,,,
"As of August 27, 2025",,,,,,,,"Last 5 Trading Days",,,,"1 Year Ending",,
,,,,,,,,"Closing Values",,,,"Closing Values",,
,"Open","High","Low","Close","Net Chg","% Chg","High","Low","Net Chg","% Chg","High","Low","Net Chg","% Chg"
Russell 1000® Index,3538.25,3550.79,3534.60,2654.123456,9.16,0.26,3547.40,3483.25,51.20,1.46,3547.40,2719.99,496.76,16.28
Russell 2000® Index,2358.60,2375.71,2352.78,1987.654321,15.20,0.64,2373.80,2274.10,104.45,4.60,2442.03,1760.71,185.16,8.46
Russell 3000® Index,3680.78,3694.23,3676.84,3456.789012,10.14,0.28,3690.93,3620.34,58.02,1.60,3690.93,2826.03,506.36,15.90`

// Mock functions to set up the SFTP responses
export const mockFtse100Success = () => {
  // Since this is SFTP, we mock at the transport level rather than HTTP
  // The actual mocking happens in the test file with jest.mock
  return mockFtse100Response
}

export const mockRussell1000Success = () => {
  return mockRussell1000Response
}

export const mockRussell2000Success = () => {
  return mockRussell2000Response
}

export const mockRussell3000Success = () => {
  return mockRussell3000Response
}
