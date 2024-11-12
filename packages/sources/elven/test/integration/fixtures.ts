import nock from 'nock'

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

export const mockResponseSuccess = (api: string): nock.Scope => {
  return nock(api, {
    encodedQueryParams: true,
  })
    .get('/hope-money')
    .reply(
      200,
      {
        status: 'success',
        data: {
          total_value_in_usd: 4336387.72,
          btc: [
            {
              amount: 11.737,
              fiat_amount: 344719.8,
              address: '15PYHP5ZW29B3o19jFNKz6RyRdHCtzJj5H',
            },
            {
              amount: 78.51359603,
              fiat_amount: 2305971.8,
              address: '1NeikyPfPeca7eYrjpQaZ85cRx1hx6aonA',
            },
          ],
          eth: [
            {
              amount: 117.37,
              fiat_amount: 219223.1,
              address: '0xDaC46e85f075512e9b4EF0cab58B6F21434eB253',
            },
            {
              amount: 785.1359603,
              fiat_amount: 1466473.02,
              address: '0x86Edc8da69261F4d6623B3a2494BA262Dc454B7f',
            },
          ],
          timestamp: 1690797903,
        },
      },
      responseHeaders,
    )
}

export const mockResponseErrorStatus = (api: string): nock.Scope => {
  return nock(api, {
    encodedQueryParams: true,
  })
    .get('/hope-money')
    .reply(
      200,
      {
        status: 'error',
        data: {},
      },
      responseHeaders,
    )
}

export const mockResponseErrorValue = (api: string): nock.Scope => {
  return nock(api, {
    encodedQueryParams: true,
  })
    .get('/hope-money')
    .reply(
      200,
      {
        status: 'success',
        data: {
          total_value_in_usd: 100000,
          btc: [
            {
              amount: 1,
              fiat_amount: 1,
              address: '15PYHP5ZW29B3o19jFNKz6RyRdHCtzJj5H',
            },
            {
              amount: 2,
              fiat_amount: 2,
              address: '1NeikyPfPeca7eYrjpQaZ85cRx1hx6aonA',
            },
          ],
          eth: [
            {
              amount: 3,
              fiat_amount: 3,
              address: '0xDaC46e85f075512e9b4EF0cab58B6F21434eB253',
            },
            {
              amount: 4,
              fiat_amount: 4,
              address: '0x86Edc8da69261F4d6623B3a2494BA262Dc454B7f',
            },
          ],
          timestamp: 1690797903,
        },
      },
      responseHeaders,
    )
}
