import nock from 'nock'

export const mockResponseSuccessConvertEndpoint = (): nock.Scope =>
  nock('https://metals-api.com/api/', {
    encodedQueryParams: true,
  })
    .get('/convert')
    .query({ access_key: 'fake-api-key', from: 'XAU', to: 'USD', amount: 1 })
    .reply(
      200,
      () => ({
        success: true,
        query: { from: 'XAU', to: 'USD', amount: 1 },
        info: { timestamp: 1637949420, rate: 1785.0181286441143 },
        historical: false,
        date: '2021-11-26',
        result: 1785.0181286441143,
        unit: 'per ounce',
      }),
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

export const mockResponseSuccessLatestEndpoint = (): nock.Scope =>
  nock('https://metals-api.com:443', { encodedQueryParams: true })
    .get('/api/latest')
    .query({
      access_key: 'fake-api-key',
      base: 'XAU',
      symbols: 'USD',
    })
    .reply(
      200,
      {
        success: true,
        timestamp: 1641990900,
        date: '2022-01-12',
        base: 'XAU',
        rates: {
          USD: 1817.0552439305814,
        },
        unit: 'per ounce',
      },
      [
        'Date',
        'Wed, 12 Jan 2022 12:35:36 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'access-control-allow-origin',
        '*',
        'access-control-allow-methods',
        '*',
        'access-control-allow-headers',
        '*',
        'cache-control',
        'no-cache, private',
        'x-ratelimit-limit',
        '60',
        'x-ratelimit-remaining',
        '58',
        'etag',
        '"e90fb1752d1dca4f63854ab4880f7a26"',
        'via',
        '1.1 vegur',
        'CF-Cache-Status',
        'DYNAMIC',
        'Expect-CT',
        'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
        'Report-To',
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=jkvDrDgvwjWpRUo7Ke4abmt6ZiSX%2Bd1w%2FkpyHXEMQmZayCTfzwpFnIzXooJue4C5friIHY980HwXUQBWaaVhrPP2fWSGlws0znmDTIuaZY%2FLuCyusekU25thlDfngVpOBA%3D%3D"}],"group":"cf-nel","max_age":604800}',
        'NEL',
        '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
        'Server',
        'cloudflare',
        'CF-RAY',
        '6cc66cf66c2c31e5-LAX',
        'alt-svc',
        'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
      ],
    )

export const mockResponseSuccessLatestBtcEndpoint = () =>
  nock('https://metals-api.com:443', { encodedQueryParams: true })
    .get('/api/latest')
    .query({ access_key: 'fake-api-key', base: 'BTC', symbols: 'USD,XAU' })
    .reply(
      200,
      {
        success: true,
        timestamp: 1641990180,
        date: '2022-01-12',
        base: 'BTC',
        rates: {
          XAU: 0.04228229144046888,
          USD: 42968.36778447169,
        },
        unit: 'per ounce',
      },
      [
        'Date',
        'Wed, 12 Jan 2022 12:24:06 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'access-control-allow-origin',
        '*',
        'access-control-allow-methods',
        '*',
        'access-control-allow-headers',
        '*',
        'cache-control',
        'no-cache, private',
        'x-ratelimit-limit',
        '60',
        'x-ratelimit-remaining',
        '54',
        'etag',
        '"2130497edf814c1554fedfd7108f7549"',
        'via',
        '1.1 vegur',
        'CF-Cache-Status',
        'DYNAMIC',
        'Expect-CT',
        'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
        'Report-To',
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=VHWFuPNP7p6gN1%2BCwCbvH%2F45Mj44E18oevnBErKkc5gMVPavXr%2BKqiPhFAuMVBpFokuNXKbD5uEuEA7DJGjJpS%2BN6YoYkIu64Jc0N%2F78evcIC5V0gmY6esMA64cu4zaxew%3D%3D"}],"group":"cf-nel","max_age":604800}',
        'NEL',
        '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
        'Server',
        'cloudflare',
        'CF-RAY',
        '6cc65c205c2a7aa2-LAX',
        'alt-svc',
        'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
      ],
    )
