import nock from 'nock'

const fxData = {
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
}

const metalData = {
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
}

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
          'US.CHNLNK.FX': fxData,
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
          'US.CHNLNK.FX': fxData,
          'US.CHNLNK.METAL': metalData,
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()
    .get('/v3/markets/status')
    .query({ fin_id: 'US.CHNLNK.FX,US.CHNLNK.METAL,US.CHNLNK.NYSE' })
    .reply(
      200,
      {
        data: {
          'US.CHNLNK.FX': fxData,
          'US.CHNLNK.METAL': metalData,
          'US.CHNLNK.NYSE': {
            fin_id: 'US.CHNLNK.NYSE',
            exchange: 'NYSE',
            market: 'NYSE',
            products: 'NYSE',
            status: 'Open',
            reason: 'Primary Trading Session',
            timezone: 'America/New_York',
            local_time: '2024-05-31T16:37:34-05:00',
            until: '2024-06-02T16:00:00-05:00',
            next_bell: '2024-06-02T17:00:00-05:00',
          },
        },
      },
      ['Content-Type', 'application/json'],
    )

export const mockSessionSuccess = (): nock.Scope =>
  nock('https://api.tradinghours.com', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: 'Bearer fake-api-key',
    },
  })
    .get('/v3/markets/hours-multiday')
    .query((query) => {
      return (
        query.fin_id === 'US.CHNLNK.NYSE' &&
        query.start === '2021-12-31' &&
        query.end === '2022-01-02'
      )
    })
    .reply(
      200,
      {
        data: {
          start: '2021-12-31',
          end: '2022-01-02',
          schedule: [
            {
              phase_type: 'Other',
              phase_name: 'Overnight',
              phase_memo: null,
              status: 'Closed',
              start: '2022-12-31T20:00:00-05:00',
              end: '2022-01-01T04:00:00-05:00',
            },
            {
              phase_type: 'Pre-Trading Session',
              phase_name: '',
              phase_memo: null,
              status: 'Closed',
              start: '2022-01-01T04:00:00-05:00',
              end: '2022-01-01T09:30:00-05:00',
            },
            {
              phase_type: 'Primary Trading Session',
              phase_name: '',
              phase_memo: null,
              status: 'Open',
              start: '2022-01-01T09:30:00-05:00',
              end: '2022-01-01T16:00:00-05:00',
            },
            {
              phase_type: 'Post-Trading Session',
              phase_name: '',
              phase_memo: null,
              status: 'Closed',
              start: '2022-01-01T16:00:00-05:00',
              end: '2022-01-01T20:00:00-05:00',
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
