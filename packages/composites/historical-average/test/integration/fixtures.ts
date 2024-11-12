import nock from 'nock'

export const mockCoinmarketcapAdapter = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      id: '1',
      data: {
        endpoint: 'historical',
        base: 'ETH',
        quote: 'USD',
        start: /2021-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z/,
        end: /2021-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z/,
        interval: '1d',
      },
    })
    .reply(
      200,
      {
        status: {
          timestamp: '2021-12-01T14:00:29.872Z',
          error_code: 0,
          error_message: null,
          elapsed: 17,
          credit_count: 1,
          notice: null,
        },
        data: {
          quotes: [
            {
              timestamp: '2021-11-01T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4324.626793776302,
                  volume_24h: 17985288261.12817,
                  market_cap: 511040780622.94354,
                  timestamp: '2021-11-01T23:59:02.000Z',
                },
              },
            },
            {
              timestamp: '2021-11-02T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4584.798668356236,
                  volume_24h: 20794448222.007755,
                  market_cap: 541846540463.1386,
                  timestamp: '2021-11-02T23:59:02.000Z',
                },
              },
            },
            {
              timestamp: '2021-11-03T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4607.193607027514,
                  volume_24h: 21220463154.65477,
                  market_cap: 544555114009.2954,
                  timestamp: '2021-11-03T23:59:02.000Z',
                },
              },
            },
            {
              timestamp: '2021-11-04T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4537.324081282544,
                  volume_24h: 18415244464.319904,
                  market_cap: 536356841434.358,
                  timestamp: '2021-11-04T23:59:02.000Z',
                },
              },
            },
            {
              timestamp: '2021-11-05T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4486.243405210834,
                  volume_24h: 15086003585.895256,
                  market_cap: 530378899238.4388,
                  timestamp: '2021-11-05T23:59:02.000Z',
                },
              },
            },
            {
              timestamp: '2021-11-06T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4521.581082805599,
                  volume_24h: 14429076699.561468,
                  market_cap: 534616843812.5647,
                  timestamp: '2021-11-06T23:59:02.000Z',
                },
              },
            },
            {
              timestamp: '2021-11-07T23:59:02.000Z',
              quote: {
                USD: {
                  price: 4620.5545029476225,
                  volume_24h: 13541376033.001528,
                  market_cap: 546381671971.18475,
                  timestamp: '2021-11-07T23:59:02.000Z',
                },
              },
            },
          ],
          id: 1027,
          name: 'Ethereum',
          symbol: 'ETH',
          is_active: 1,
          is_fiat: 0,
        },
      },
      [
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '1570',
        'ETag',
        'W/"622-9erE3lcWoqAfMLTzKbOESASP4e0"',
        'Connection',
        'close',
      ],
    )
