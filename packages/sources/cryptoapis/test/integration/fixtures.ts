import nock from 'nock'

export function mockBalanceResponse() {
  nock('https://api.cryptoapis.io:443', { encodedQueryParams: true })
    .get('/v1/bc/btc/testnet/address/n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF')
    .reply(
      200,
      {
        payload: {
          address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
          totalSpent: '0.0498',
          totalReceived: '135.74870753',
          balance: '135.69890753',
          txi: 1,
          txo: 1958,
          txsCount: 1944,
          addresses: ['n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF'],
        },
      },
      [
        'Date',
        'Mon, 15 Nov 2021 15:08:07 GMT',
        'Content-Type',
        'application/json;charset=UTF-8',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'x-credits-consumed',
        '1',
        'x-credits-available',
        '1264',
        'CF-Cache-Status',
        'DYNAMIC',
        'Expect-CT',
        'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
        'Report-To',
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=RHbn7wwzPr2bvJziwEzJpG9uetpsb%2BE7zsxX3zAhpXidi3CycDc4zJ8hw3AITqcDHlgK%2Bd6K%2BxMhNYVDUKGWeaSWjt1Ejp3U4cM7bRJ0sjyYqtrTB7Up8OCNsM%2BN9uItZ2ktTg%3D%3D"}],"group":"cf-nel","max_age":604800}',
        'NEL',
        '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
        'Server',
        'cloudflare',
        'CF-RAY',
        '6ae964a068cceb95-LAX',
        'alt-svc',
        'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
      ],
    )
}

export function mockBcInfoResponse() {
  nock('https://api.cryptoapis.io:443', { encodedQueryParams: true })
    .get('/v1/bc/btc/mainnet/info')
    .reply(
      200,
      {
        payload: {
          difficulty: 22674148233453.11,
          headers: 709848,
          chain: 'main',
          chainWork: '000000000000000000000000000000000000000024275e7297eb45d00a73320f',
          mediantime: 1636987430,
          blocks: 709848,
          bestBlockHash: '000000000000000000097d3bd56240cba422ae3ffd42c5a8fe349157f3de6c20',
          currency: 'BTC',
          transactions: 686990377,
          verificationProgress: 0.9999988307165758,
        },
      },
      [
        'Date',
        'Mon, 15 Nov 2021 15:11:51 GMT',
        'Content-Type',
        'application/json;charset=UTF-8',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'x-credits-consumed',
        '1',
        'x-credits-available',
        '1256',
        'CF-Cache-Status',
        'DYNAMIC',
        'Expect-CT',
        'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
        'Report-To',
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=SvurgJiHFFlcj7HOO9Qd6p3b6e2XxpTNFxfHyfHvg1cQ%2B5kda6rhZZYVHDEBKYHQG5QPG65Sq0G4iG%2FrnJRmv%2BManEjpURo4yE3e58wZdWxDMzUZbWHHxFPSgiZuOZ0rKrYqqw%3D%3D"}],"group":"cf-nel","max_age":604800}',
        'NEL',
        '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
        'Server',
        'cloudflare',
        'CF-RAY',
        '6ae96a175c31ebad-LAX',
        'alt-svc',
        'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
      ],
    )
}

export function mockCryptoResponse() {
  nock('https://api.cryptoapis.io:443', { encodedQueryParams: true })
    .get('/v1/exchange-rates/BTC/USD')
    .reply(
      200,
      {
        payload: {
          weightedAveragePrice: 64671.845340501786,
          amount: 2.2908423,
          timestamp: 1636989278,
          datetime: '2021-11-15T15:14:38+0000',
          baseAsset: 'BTC',
          quoteAsset: 'USD',
        },
      },
      [
        'Date',
        'Mon, 15 Nov 2021 15:14:43 GMT',
        'Content-Type',
        'application/json;charset=utf-8',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'x-credits-consumed',
        '1',
        'x-credits-available',
        '2500',
        'CF-Cache-Status',
        'DYNAMIC',
        'Expect-CT',
        'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
        'Report-To',
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=PMnVV940SpSQKOySYnzhU8NtqRcv%2BqVF%2BbyDHOaJFWGJ9hnB5sQ7TMpfVBjdc%2BeImmqDM7J9vM8pylmiwIDq8Z5bJOznRoFdQjlI4vhPCpS%2B9k4hG%2BSvFjI%2F4WEAVLDFIot%2FJA%3D%3D"}],"group":"cf-nel","max_age":604800}',
        'NEL',
        '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
        'Server',
        'cloudflare',
        'CF-RAY',
        '6ae96e48992d04eb-LAX',
        'alt-svc',
        'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
      ],
    )
}
