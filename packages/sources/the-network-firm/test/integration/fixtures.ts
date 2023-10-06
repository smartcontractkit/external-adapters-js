import nock from 'nock'

export const mockMCO2Response = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/MCO2')
    .reply(
      200,
      { totalMCO2: 3041044, totalCarbonCredits: 3041044, timestamp: '2022-04-04T11:00:46.577Z' },
      [
        'Date',
        'Mon, 15 Nov 2021 16:14:53 GMT',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '437',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Credentials',
        'true',
        'Access-Control-Allow-Methods',
        'GET, PUT, POST, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers',
        'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization',
        'Server',
        'BTC.com',
        'X-Frame-Options',
        'SAMEORIGIN',
        'X-XSS-Protection',
        '1; mode=block',
        'X-Content-Type-Options',
        'nosniff',
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      ],
    )
    .persist()

export const mockSTBTResponseSuccess = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/STBT')
    .reply(200, {
      accountName: 'STBT',
      totalReserve: 72178807.56,
      totalToken: 71932154.99,
      timestamp: '2023-06-02T12:53:23.604Z',
    })
    .persist()

export const mockSTBTResponseFailure = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/STBT')
    .reply(200, {
      accountName: 'STBT',
      totalReserve: 72178807.56,
      totalToken: 71932154.99,
      timestamp: '2023-06-02T12:53:23.604Z',
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()

export const mockBackedResponseSuccess = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/backed')
    .reply(200, {
      timestamp: '2023-08-22T15:00:31.529Z',
      accounts: [
        {
          accountName: 'IBTA',
          totalReserve: 195605,
          totalToken: 195584.9637993383,
        },
        {
          accountName: 'IB01',
          totalReserve: 350628,
          totalToken: 350607.90039302636,
        },
        {
          accountName: 'CSPX',
          totalReserve: 1833,
          totalToken: 1828.687926481026,
        },
      ],
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockBackedResponseFailure = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/backed')
    .reply(200, {
      timestamp: '2023-08-22T15:00:31.529Z',
      accounts: [
        {
          accountName: 'IBTA',
          totalReserve: 195605,
          totalToken: 195584.9637993383,
        },
        {
          accountName: 'IB01',
          totalReserve: 350628,
          totalToken: 350607.90039302636,
        },
        {
          accountName: 'CSPX',
          totalReserve: 1833,
          totalToken: 1828.687926481026,
        },
      ],
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()

export const mockUSDRResponseSuccess = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/USDR')
    .reply(200, {
      accountName: 'USDR',
      totalReserve: 39138216.32189752,
      totalToken: 8368048.75007513,
      detailedReserve: {
        DAI: 1999280.1996740077,
        realEstate: 24368253.51404984,
        TNGBL: 8543905.044571292,
        insuranceFund: 4226777.563602379,
      },
      timestamp: '2023-08-23T23:00:53.859Z',
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockUSDRResponseFailure = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/USDR')
    .reply(200, {
      accountName: 'USDR',
      totalReserve: 39138216.32189752,
      totalToken: 8368048.75007513,
      detailedReserve: {
        DAI: 1999280.1996740077,
        realEstate: 24368253.51404984,
        TNGBL: 8543905.044571292,
        insuranceFund: 4226777.563602379,
      },
      timestamp: '2023-08-23T23:00:53.859Z',
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()

export const mockEurrResponseSuccess = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/EURR')
    .reply(200, {
      accountName: 'EURR',
      totalReserve: 10000000,
      totalToken: 10000000,
      timestamp: '2023-08-21T11:34:19.477Z',
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockEurrResponseFailure = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/EURR')
    .reply(200, {
      accountName: 'EURR',
      totalReserve: 10000000,
      totalToken: 10000000,
      timestamp: '2023-08-21T11:34:19.477Z',
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()

export const mockGiftResponseSuccess = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/GIFT')
    .reply(200, {
      accountName: 'GIFT',
      totalReserve: 10000000,
      totalToken: 9999999.58,
      timestamp: '2023-09-25T13:20:40.048Z',
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockGiftResponseFailure = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/GIFT')
    .reply(200, {
      accountName: 'GIFT',
      totalReserve: 10000000,
      totalToken: 9999999.58,
      timestamp: '2023-09-25T13:20:40.048Z',
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()
