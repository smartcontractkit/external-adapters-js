import nock from 'nock'

const API_ENDPOINT = 'https://api.fxmacrodata.com/v1'
const API_KEY = 'fake-api-key'

const responseHeaders = [
  'Content-Type',
  'application/json',
  'Connection',
  'close',
  'Vary',
  'Accept-Encoding',
  'Vary',
  'Origin',
]

export const mockForexResponseSuccess = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
    reqheaders: { 'X-API-Key': API_KEY },
  })
    .get('/forex/USD/JPY')
    .query({ limit: 1 })
    .reply(
      200,
      () => ({
        base: 'USD',
        quote: 'JPY',
        source: 'Official central-bank reference rates',
        start_date: '2026-06-18',
        end_date: '2026-06-18',
        data: [
          {
            date: '2026-06-18',
            val: 161.1288,
            observation_datetime: 1781740800,
            observation_datetime_iso: '2026-06-18T00:00:00Z',
            observation_datetime_precision: 'date',
          },
        ],
      }),
      responseHeaders,
    )
    .persist()

export const mockForexResponseEmpty = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
    reqheaders: { 'X-API-Key': API_KEY },
  })
    .get('/forex/USD/BRL')
    .query({ limit: 1 })
    .reply(
      200,
      () => ({
        base: 'USD',
        quote: 'BRL',
        data: [],
      }),
      responseHeaders,
    )
    .persist()

export const mockIndicatorResponseSuccess = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
    reqheaders: { 'X-API-Key': API_KEY },
  })
    .get('/announcements/USD/inflation')
    .query({ limit: 1 })
    .reply(
      200,
      () => ({
        currency: 'USD',
        indicator: 'inflation',
        latest_available_date: '2026-02-28',
        data: [
          {
            date: '2026-02-28',
            val: 3.0,
            val_mom: 0.2,
            announcement_datetime: 1772433000,
            announcement_datetime_local: '2026-03-01T08:30:00-05:00',
          },
        ],
      }),
      responseHeaders,
    )
    .persist()

export const mockIndicatorResponseEmpty = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
    reqheaders: { 'X-API-Key': API_KEY },
  })
    .get('/announcements/USD/gdp')
    .query({ limit: 1 })
    .reply(
      200,
      () => ({
        currency: 'USD',
        indicator: 'gdp',
        data: [],
      }),
      responseHeaders,
    )
    .persist()
