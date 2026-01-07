import nock from 'nock'

export const MOCK_DA_API_URL = 'https://test.digitalasset.api'
export const MOCK_ATTESTER_API_URL_1 = 'https://test.attester1.api'
export const MOCK_ATTESTER_API_URL_2 = 'https://test.attester2.api'
export const MOCK_ATTESTER_API_URLS = `${MOCK_ATTESTER_API_URL_1},${MOCK_ATTESTER_API_URL_2}`

export const mockDaApiResponse = (): nock.Scope =>
  nock(MOCK_DA_API_URL)
    .get('/instruments')
    .reply(
      200,
      {
        instruments: [
          {
            id: 'CBTC',
            name: 'CBTC',
            symbol: 'CBTC',
            totalSupply: '21000000.1234567890',
            totalSupplyAsOf: null,
            decimals: 10,
            supportedApis: {},
          },
        ],
        nextPageToken: null,
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockAttesterApiResponse = (): void => {
  const attesterResponse = {
    status: 'ready',
    total_supply_cbtc: '7.899823260000001',
    last_updated: '2025-01-01T00:00:00.000Z',
  }

  nock(MOCK_ATTESTER_API_URL_1)
    .persist()
    .get('/app/get-total-cbtc-supply')
    .reply(200, attesterResponse, ['Content-Type', 'application/json'])

  nock(MOCK_ATTESTER_API_URL_2)
    .persist()
    .get('/app/get-total-cbtc-supply')
    .reply(200, attesterResponse, ['Content-Type', 'application/json'])
}

export const mockAllApis = (): void => {
  mockDaApiResponse()
  mockAttesterApiResponse()
}
