import nock from 'nock'

export const mockAddressesResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8082', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/')
    .reply(
      200,
      () => ({
        result: [
          {
            id: '601c5e4b11b1d4001e37091aa2618ee9',
            address: '31h6SJ58NqVrifuyXN5A19ByD6vgyKVHEY',
            balance: '123',
            type: 'custodial',
            verified: false,
          },
          {
            id: '602412a8a8f831001e0395eeeca68779',
            address: '31rbKHDMsFpTF9T4u74osP24ZejMJnHukj',
            balance: '0',
            type: 'custodial',
            verified: false,
          },
        ],
        count: 1,
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
    .persist()

export const mockMembersResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/')
    .reply(
      200,
      () => ({
        result: [
          {
            id: '5e5ec5d8a221fb000946fd4ab2d71522',
            token: 'wbtc',
            tags: ['dao', 'merchant', 'exchange'],
            name: 'AirSwap',
            addresses: [
              {
                id: '601323767069d60008cb538a682a0a35',
                address: '0xfaf0708d1aed2566205d61f471d7e4aeb10910ea',
                type: 'merchant',
                balance: '123',
                verified: true,
              },
              {
                id: '601323767069d60008cb538b32c33cb1',
                address: '3Lto4jAz1aGJQwNSAZ6TEEFuoHoBb8kRc7',
                type: 'custodial',
                balance: '456',
                verified: false,
              },
              {
                id: '601323767069d60008cb538cd1176c5d',
                address: '3QS2zmhLYVTKmPewvWs4vze73ecinUM9Hd',
                type: 'deposit',
                balance: '789',
                verified: false,
              },
            ],
            description:
              'AirSwap is a peer-to-peer trading network built on Ethereum. Our mission is to empower people through global, frictionless trade.',
            merchantPortalUri: '',
            hasMerchantPortalUri: false,
            websiteUri: 'https://www.airswap.io/',
          },
        ],
        count: 1,
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
    .persist()
