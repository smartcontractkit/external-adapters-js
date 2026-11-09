import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://data-engine', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({
      data: {
        mid: '1',
        lastSeenTimestampNs: '2',
        bid: '3',
        bidVolume: 4,
        ask: '5',
        askVolume: 6,
        lastTradedPrice: '7',
        marketStatus: 1,
        decimals: 1,
      },
      statusCode: 200,
    }))
    .persist()

export const mockTradingHoursResponseFailure = (): nock.Scope =>
  nock('http://trading-hours', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({ statusCode: 500 }))
    .persist()

export const mockSourceAdapterResponse = (): nock.Scope =>
  nock('http://solana-functions', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'extension',
        stateAccountAddress: '6V4gLu7aC63e6CTEJXu71wtx5FMrZ3FQoST7UXXqgPuQ',
        extensionDataOffset: 166,
        extensionFields: [
          { extensionType: 25, name: 'multiplier', offset: 32, type: 'float64' },
          { extensionType: 25, name: 'activationDateTime', offset: 40, type: 'int64' },
          { extensionType: 25, name: 'newMultiplier', offset: 48, type: 'float64' },
        ],
      },
    })
    .reply(200, () => ({
      data: {
        multiplier: 1.5,
        activationDateTime: '1762387200',
        newMultiplier: 1.75,
      },
      statusCode: 200,
    }))
    .persist()
