import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.tradinghours.com', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: 'Bearer fake-api-key',
    },
  })
    .persist()
    .get('/v3/markets/status')
    .query({ fin_id: 'US.CHNLNK.FX' })
    .reply(
      200,
      {
        data: {
          'US.CHNLNK.FX': {
            fin_id: 'US.CBOE.FX',
            exchange: 'CHNLNK',
            market: 'FX',
            products: 'CHNLNK FX',
            status: 'Open',
            reason: 'Primary Trading Session',
            timezone: 'America/New_York',
            local_time: '2024-05-31T16:37:34-05:00',
            until: '2024-06-02T16:00:00-05:00',
            next_bell: '2024-06-02T17:00:00-05:00',
          },
        },
        meta: {
          utc_time: '2024-05-31T21:37:34+00:00',
          time: '2024-05-31T21:37:34+00:00',
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()
    .get('/v3/markets/status')
    .query({ fin_id: 'US.CHNLNK.FX,US.CHNLNK.METAL' })
    .reply(
      200,
      {
        data: {
          'US.CHNLNK.FX': {
            fin_id: 'US.CHNLNK.FX',
            exchange: 'CHNLNK',
            market: 'FX',
            products: 'CHNLNK FX',
            status: 'Open',
            reason: 'Primary Trading Session',
            timezone: 'America/New_York',
            local_time: '2024-05-31T16:37:34-05:00',
            until: '2024-06-02T16:00:00-05:00',
            next_bell: '2024-06-02T17:00:00-05:00',
          },
          'US.CHNLNK.METAL': {
            fin_id: 'US.CHNLNK.METAL',
            exchange: 'CHNLNK',
            market: 'Precious Metals',
            products: 'Adjusted Gold and Silver Market',
            status: 'Closed',
            reason: null,
            timezone: 'America/Chicago',
            local_time: '2024-05-31T16:37:34-05:00',
            until: '2024-06-02T16:00:00-05:00',
            next_bell: '2024-06-02T17:00:00-05:00',
          },
        },
        meta: {
          utc_time: '2024-05-31T21:37:34+00:00',
          time: '2024-05-31T21:37:34+00:00',
        },
      },
      ['Content-Type', 'application/json'],
    )
