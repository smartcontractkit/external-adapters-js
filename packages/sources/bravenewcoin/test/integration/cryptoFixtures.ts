import nock from 'nock'

export function mockAuthTokenResponse() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .post('/oauth/token', {
      audience: 'https://api.bravenewcoin.com',
      client_id: 'oCdQoZoI96ERE9HY3sQ7JmbACfBf55RY',
      grant_type: 'client_credentials',
    })
    .reply(
      200,
      {
        access_token:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5EVXhNRGhHT0VReE56STVOelJCTTBJM1FrUTVOa0l4TWtRd1FrSTJSalJFTVRaR1F6QTBOZyJ9.eyJpc3MiOiJodHRwczovL2F1dGguYnJhdmVuZXdjb2luLmNvbS8iLCJzdWIiOiJvQ2RRb1pvSTk2RVJFOUhZM3NRN0ptYkFDZkJmNTVSWUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9hcGkuYnJhdmVuZXdjb2luLmNvbSIsImlhdCI6MTYzNDYzNTA4NiwiZXhwIjoxNjM0NzIxNDg2LCJhenAiOiJvQ2RRb1pvSTk2RVJFOUhZM3NRN0ptYkFDZkJmNTVSWSIsInNjb3BlIjoicmVhZDppbmRleC10aWNrZXIgcmVhZDpyYW5raW5nIHJlYWQ6bXdhIHJlYWQ6Z3dhIHJlYWQ6YWdncmVnYXRlcyByZWFkOm1hcmtldCByZWFkOmFzc2V0IHJlYWQ6b2hsY3YgcmVhZDptYXJrZXQtY2FwIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.UdzOdOSNdP8y5iMVypN-Bull3ohuV48Pkb1_niBoVavxHNczBfHxOrjrZcvj6-G1QFhEHO5aglmZ3EBqCH_w45xcRziWf4LNTMtcBUwIjjM4ceUd5RH2pmeSmrM7z33DWAqL0vyTcpuQREGr5XqKjYMAmvm27eyycJddZBiPWRk4z8TP73eyTqiYE_JZDTEvDaaYW4xwbp7QGuSDNWv6WuG3jnDpsX2eeq0HH7Q6gAaSMvfUfOAScqq0wPbxv_SBh56eY4sE5AP5RdeY3GSRzX3Q4U0Pxbf_kiM_TLBAtPSqa8oJxLjj84bVtm_jDzRJAYGRTWOlZHwGCfAZA4mLDg',
        scope:
          'read:index-ticker read:ranking read:mwa read:gwa read:aggregates read:market read:asset read:ohlcv read:market-cap',
        expires_in: 45079,
        token_type: 'Bearer',
      },
      [
        'Content-Type',
        'application/json;charset=UTF-8',
        'Date',
        'Tue, 19 Oct 2021 20:46:47 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 82893cc36087a50f9a150a621d10e740.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'fNiOd5L-jl94gUFhBIKhbFseFmUxCu_als1CNJE1hVLwzHJOdA10fg==',
        'X-Amz-Cf-Pop',
        'SEA19-C3',
        'X-Cache',
        'Miss from cloudfront',
        'X-RapidAPI-Region',
        'AWS - us-west-2',
        'X-RapidAPI-Version',
        '1.2.8',
        'Content-Length',
        '1120',
        'Connection',
        'Close',
      ],
    )
}

export function mockBtcCoinEndpoint() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/asset')
    .query({ status: 'ACTIVE', symbol: 'BTC' })
    .reply(
      200,
      {
        content: [
          {
            id: 'f1ff77b6-3ab4-4719-9ded-2fc7e71cff1f',
            name: 'Bitcoin',
            symbol: 'BTC',
            slugName: 'bitcoin',
            status: 'ACTIVE',
            type: 'CRYPTO',
            url: 'https://bitcoin.org',
          },
        ],
      },
      [
        'Age',
        '295',
        'Cache-Control',
        'max-age=300',
        'Content-Type',
        'application/json',
        'Date',
        'Tue, 19 Oct 2021 20:46:47 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 8cb7de37a1655236518810d0aabb8656.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'IGd9EWzcWnMuxKCxuH0kfazxduXb8_q2P2cFU3jCcxLfo77U9hwYXA==',
        'X-Amz-Cf-Pop',
        'SEA19-C3',
        'X-Cache',
        'Hit from cloudfront',
        'x-content-type-options',
        'nosniff',
        'x-frame-options',
        'DENY',
        'X-RapidAPI-Region',
        'AWS - us-west-2',
        'X-RapidAPI-Version',
        '1.2.8',
        'x-xss-protection',
        '1; mode=block',
        'Content-Length',
        '174',
        'Connection',
        'Close',
      ],
    )
}

export function mockBtcMarketEndpoint() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/market-cap')
    .query({ assetId: 'f1ff77b6-3ab4-4719-9ded-2fc7e71cff1f' })
    .reply(
      200,
      {
        content: [
          {
            id: '98d6421e-9310-4c66-96a6-5b7fe8324b78',
            assetId: 'f1ff77b6-3ab4-4719-9ded-2fc7e71cff1f',
            timestamp: '2021-10-19T20:45:00.000Z',
            marketCapRank: 1,
            volumeRank: 1,
            price: 64200.69615416671,
            volume: 331488.7604703418,
            totalSupply: 18848393,
            freeFloatSupply: 18845442,
            marketCap: 1209890495732.972,
            totalMarketCap: 1210079951987.3228,
          },
        ],
      },
      [
        'Age',
        '21',
        'Cache-Control',
        'max-age=30',
        'Content-Type',
        'application/json;charset=UTF-8',
        'Date',
        'Tue, 19 Oct 2021 20:46:48 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 5c35539543902c678280929df206948c.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'YbJ-KnUeqSXvEqbjPSKz1UuKhqRPPl_pU72havAsMn_Hq-kyqZbq6g==',
        'X-Amz-Cf-Pop',
        'SEA19-C3',
        'X-Cache',
        'Hit from cloudfront',
        'x-content-type-options',
        'nosniff',
        'x-frame-options',
        'DENY',
        'X-RapidAPI-Region',
        'AWS - us-west-2',
        'X-RapidAPI-Version',
        '1.2.8',
        'x-xss-protection',
        '1; mode=block',
        'Content-Length',
        '349',
        'Connection',
        'Close',
      ],
    )
}

export function mockCryptoResponse() {
  nock('http://localhost:8080', { encodedQueryParams: true })
    .post('/', { id: '1', data: { endpoint: 'crypto', base: 'ETH', quote: 'BTC' } })
    .reply(
      200,
      {
        jobRunID: '1',
        result: 0.05986385840449063,
        statusCode: 200,
        data: { result: 0.05986385840449063 },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '100',
        'ETag',
        'W/"64-3kXL7+uvKLguB6cSInOvQtu4RgM"',
        'Date',
        'Tue, 19 Oct 2021 20:46:48 GMT',
        'Connection',
        'close',
      ],
    )
}

export function mockEthCoinEndpoint() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/asset')
    .query({ status: 'ACTIVE', symbol: 'ETH' })
    .reply(
      200,
      {
        content: [
          {
            id: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
            name: 'Ethereum',
            symbol: 'ETH',
            slugName: 'ethereum',
            status: 'ACTIVE',
            type: 'CRYPTO',
            url: 'https://www.ethereum.org/',
          },
        ],
      },
      [
        'Age',
        '202',
        'Cache-Control',
        'max-age=300',
        'Content-Type',
        'application/json',
        'Date',
        'Tue, 19 Oct 2021 20:46:47 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 3f3347264bcaae7af741e2a2f692c6a1.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'kmVZK42-aV7sFoLE1e_ag3Qbh2J3hd_E407KsLCjnb0EawWt3FnrHA==',
        'X-Amz-Cf-Pop',
        'SEA19-C3',
        'X-Cache',
        'Hit from cloudfront',
        'x-content-type-options',
        'nosniff',
        'x-frame-options',
        'DENY',
        'X-RapidAPI-Region',
        'AWS - us-west-2',
        'X-RapidAPI-Version',
        '1.2.8',
        'x-xss-protection',
        '1; mode=block',
        'Content-Length',
        '182',
        'Connection',
        'Close',
      ],
    )
}

export function mockEthMarketEndpoint() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/market-cap')
    .query({ assetId: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6' })
    .reply(
      200,
      {
        content: [
          {
            id: '4dd82259-3370-4ce9-b135-1abc3c4417da',
            assetId: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
            timestamp: '2021-10-19T20:45:00.000Z',
            marketCapRank: 2,
            volumeRank: 2,
            price: 3843.301384042762,
            volume: 2640429.189945329,
            totalSupply: 117994697,
            freeFloatSupply: 117353153,
            marketCap: 451023535346.682,
            totalMarketCap: 453489182289.80634,
          },
        ],
      },
      [
        'Age',
        '27',
        'Cache-Control',
        'max-age=30',
        'Content-Type',
        'application/json;charset=UTF-8',
        'Date',
        'Tue, 19 Oct 2021 20:46:48 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 3f3347264bcaae7af741e2a2f692c6a1.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'f9e9qBBZ3G76JKDodx-OIoxdoCVri53bu_a7MNPU6KpuoebOfQAvCw==',
        'X-Amz-Cf-Pop',
        'SEA19-C3',
        'X-Cache',
        'Hit from cloudfront',
        'x-content-type-options',
        'nosniff',
        'x-frame-options',
        'DENY',
        'X-RapidAPI-Region',
        'AWS - us-west-2',
        'X-RapidAPI-Version',
        '1.2.8',
        'x-xss-protection',
        '1; mode=block',
        'Content-Length',
        '350',
        'Connection',
        'Close',
      ],
    )
}
