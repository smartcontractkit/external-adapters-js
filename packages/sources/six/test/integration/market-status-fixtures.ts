import nock from 'nock'

export const mockOneMarket = (): nock.Scope =>
  nock('https://api.six-group.com')
    .get('/web/v2/markets/referenceData/marketBase')
    .query({ scheme: 'BC', ids: '1' })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 1,
                  marketStatus: 'ACTIVE',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockTwoMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .get('/web/v2/markets/referenceData/marketBase')
    .query({ scheme: 'BC', ids: '1,2' })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 1,
                  marketStatus: 'ACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 2,
                  marketStatus: 'INACTIVE',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockThreeMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .get('/web/v2/markets/referenceData/marketBase')
    .query({ scheme: 'BC', ids: '1,2,3' })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 1,
                  marketStatus: 'ACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 2,
                  marketStatus: 'INACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 3,
                  marketStatus: 'REFERENCE_ONLY',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockFourMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .get('/web/v2/markets/referenceData/marketBase')
    .query({ scheme: 'BC', ids: '1,2,3,4' })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 1,
                  marketStatus: 'ACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 2,
                  marketStatus: 'INACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 3,
                  marketStatus: 'REFERENCE_ONLY',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()
