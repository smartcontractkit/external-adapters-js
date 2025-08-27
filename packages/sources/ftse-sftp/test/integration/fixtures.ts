// Mock FTSE CSV data with fixed date for consistent snapshots
export const mockFtseResponse = `23/08/2024 (C) FTSE International Limited 2024. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code	Index/Sector Name	Number of Constituents	Index Base Currency	USD Index	GBP Index	EUR Index	JPY Index	AUD Index	CNY Index	HKD Index	CAD Index	LOC Index	Base Currency (GBP) Index
AS0	FTSE All-Small Index	234	GBP	4659.89484111	5017.24846324	4523.90007694	2963.46786723	6470.75900926	10384.47293100	4667.43880552	5177.36970414		5017.24846324
ASX	FTSE All-Share Index	543	GBP	4659.78333168	5017.12840249	4523.79182181	2963.39695263	6470.60416658	10384.22443471	4667.32711557	5177.24581174		5017.12840249
100	FTSE 100 Index	100	GBP	8045.12345678	8045.12345678	7241.61111111	5406.87654321	11012.34567890	17684.98765432	8053.21098765	8917.54321098		8045.12345678`

// Mock Russell CSV data  
export const mockRussellResponse = `Date,Index Name,Index Code,Index Value,Market Cap,Number of Companies
2024-08-23,Russell 1000 Index,RU10INTR,2654.123456,45234567890.12,1000
2024-08-23,Russell 1000 Growth Index,RU10GRTR,3456.789012,23456789012.34,500
2024-08-23,Russell 1000 Value Index,RU10VLTR,1987.654321,21777778878.78,500`

// Mock SFTP server responses
export const mockSftpFileResponses = {
  '/data/ukallv2308.csv': mockFtseResponse,
  '/data/daily_values_russell_242308.csv': mockRussellResponse,
  '/custom/path/ukallv2308.csv': mockFtseResponse,
  '/ukallv2308.csv': mockFtseResponse,
  '/valid/path/ukallv2308.csv': mockFtseResponse,
}

// Expected parsed FTSE data structure
export const expectedFtseData = [
  {
    indexCode: 'AS0',
    indexSectorName: 'FTSE All-Small Index',
    numberOfConstituents: 234,
    indexBaseCurrency: 'GBP',
    gbpIndex: 5017.24846324,
  },
  {
    indexCode: 'ASX',
    indexSectorName: 'FTSE All-Share Index',
    numberOfConstituents: 543,
    indexBaseCurrency: 'GBP',
    gbpIndex: 5017.12840249,
  },
  {
    indexCode: '100',
    indexSectorName: 'FTSE 100 Index',
    numberOfConstituents: 100,
    indexBaseCurrency: 'GBP',
    gbpIndex: 8045.12345678,
  },
]

// Expected parsed Russell data structure
export const expectedRussellData = [
  {
    date: '2024-08-23',
    indexName: 'Russell 1000 Index',
    indexCode: 'RU10INTR',
    indexValue: 2654.123456,
    marketCap: 45234567890.12,
    numberOfCompanies: 1000,
  },
  {
    date: '2024-08-23',
    indexName: 'Russell 1000 Growth Index',
    indexCode: 'RU10GRTR',
    indexValue: 3456.789012,
    marketCap: 23456789012.34,
    numberOfCompanies: 500,
  },
  {
    date: '2024-08-23',
    indexName: 'Russell 1000 Value Index',
    indexCode: 'RU10VLTR',
    indexValue: 1987.654321,
    marketCap: 21777778878.78,
    numberOfCompanies: 500,
  },
]

// Helper function to setup nock mocks for various test scenarios
export const setupNockMocks = () => {
  // This is where you would set up HTTP mocks if the adapter used HTTP requests
  // Since this is an SFTP adapter, we'll primarily rely on mocked SFTP clients
}

// Helper function to create consistent timestamps for snapshots
export const getFixedTimestamp = () => {
  const mockDate = new Date('2024-08-23T10:00:00.000Z')
  return mockDate.getTime()
}

// Helper function to normalize response data for snapshot testing
export const normalizeResponseForSnapshot = (response: any) => {
  // Replace dynamic timestamps with fixed values for consistent snapshots
  if (response.timestamps) {
    return {
      ...response,
      timestamps: {
        providerDataRequestedUnixMs: getFixedTimestamp(),
        providerDataReceivedUnixMs: getFixedTimestamp(),
      },
    }
  }
  return response
}

// Test environment configuration
export const testEnvConfig = {
  SFTP_HOST: 'sftp.test.com',
  SFTP_PORT: '22',
  SFTP_USERNAME: 'testuser',
  SFTP_PASSWORD: 'testpass',
  WARMUP_SUBSCRIPTION_TTL: '120000',
  CACHE_MAX_AGE: '90000',
  CACHE_POLLING_MAX_RETRIES: '5',
  METRICS_ENABLED: 'false',
  LOG_LEVEL: 'info',
  REQUEST_COALESCING_ENABLED: 'false',
  REQUEST_COALESCING_INTERVAL: '100',
  REQUEST_COALESCING_INTERVAL_MAX: '1000',
  REQUEST_COALESCING_INTERVAL_COEFFICIENT: '2',
  REQUEST_COALESCING_ENTROPY_MAX: '0',
  CACHE_ENABLED: 'true',
}

// Test data sets for different instruments
export const testInstruments = {
  FTSE100INDEX: {
    operation: 'download',
    remotePath: '/data',
    instrument: 'FTSE100INDEX',
    expectedFileName: 'ukallv2308.csv',
    expectedData: expectedFtseData,
  },
  Russell1000INDEX: {
    operation: 'download',
    remotePath: '/data',
    instrument: 'Russell1000INDEX',
    expectedFileName: 'daily_values_russell_242308.csv',
    expectedData: expectedRussellData,
  },
  Russell2000INDEX: {
    operation: 'download',
    remotePath: '/data',
    instrument: 'Russell2000INDEX',
    expectedFileName: 'daily_values_russell_242308.csv',
    expectedData: expectedRussellData,
  },
  Russell3000INDEX: {
    operation: 'download',
    remotePath: '/data',
    instrument: 'Russell3000INDEX',
    expectedFileName: 'daily_values_russell_242308.csv',
    expectedData: expectedRussellData,
  },
}

// Error test scenarios
export const errorTestScenarios = {
  invalidInstrument: {
    operation: 'download',
    remotePath: '/data',
    instrument: 'INVALID_INSTRUMENT',
    expectedError: 'Unsupported instrument',
  },
  missingRemotePath: {
    operation: 'download',
    instrument: 'FTSE100INDEX',
    expectedError: 'remotePath',
  },
  missingInstrument: {
    operation: 'download',
    remotePath: '/data',
    expectedError: 'instrument',
  },
  unsupportedOperation: {
    operation: 'upload',
    remotePath: '/data',
    instrument: 'FTSE100INDEX',
    expectedError: 'Unsupported operation',
  },
  invalidOperation: {
    operation: 'invalid_operation',
    remotePath: '/data',
    instrument: 'FTSE100INDEX',
    expectedError: 'operation',
  },
}
