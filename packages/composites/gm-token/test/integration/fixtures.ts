import nock from 'nock'

export const mockTiingoEAResponseSuccess = (base): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base,
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 15.694322872166047,
          bid: 15.763680197921362,
          mid: 15.729001535,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 1.0012,
          bid: 1.01,
          mid: 1.0056,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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

export const mockNCFXEAResponseSuccess = (base): nock.Scope =>
  nock('http://localhost:8082', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base,
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 15.614322872166047,
          bid: 15.863680197921362,
          mid: 15.739001535,
        },
        result: 15.739001535,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 1.001,
          bid: 1.002,
          mid: 1.0015,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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

export const mockCoinmetricsEAResponseSuccess = (base): nock.Scope =>
  nock('http://localhost:8083', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base,
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 15.59,
          bid: 15.64,
          mid: 15.61,
        },
        result: 15.739001535,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 1,
          bid: 1.002,
          mid: 1.001,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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

export const mockNCFXEAResponseFailure = (base): nock.Scope =>
  nock('http://localhost:8082', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base,
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

export const mockCoinmetricsEAResponseFailure = (base): nock.Scope =>
  nock('http://localhost:8083', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base,
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

export const mockRPCResponses = (): nock.Scope =>
  nock('http://localhost:3040/', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0xa4b1' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0xf60becbba223eea9495da3f606753867ec10d139',
          data: '0x095ce6c5000000000000000000000000fd70de6b91282d8017aa4e741e9ae325cab992d80000000000000000000000007f1fa204bb700853d36994da19f830b6ad18455c000000000000000000000000f97f4df75117a78c1a5a0dbb814af92458539fb4000000000000000000000000f97f4df75117a78c1a5a0dbb814af92458539fb4000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e583100000000000000000000000000000000000000000000000000000e337e2b0f6600000000000000000000000000000000000000000000000000000e56448efd2100000000000000000000000000000000000000000000000000000e337e2b0f6600000000000000000000000000000000000000000000000000000e56448efd2100000000000000000000000000000000000000000000d3f851987ab37fa0000000000000000000000000000000000000000000000000d5075e88df90d8c00000ab15365d3aa743e766355e2557c230d8f943e195dc84d9b2b05928a07b635ee10000000000000000000000000000000000000000000000000000000000000001',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000001186c3a294738329d44c1fff380000000000000000000000000000000005865a7eaf0180547f38cc539f817d8e00000000000000000000000000000000005650d31a2d4fda491b4b194f487279ffffffffffffffffffffffffffffffffffd8c21aed46a409997ef1809620192700000000000000000000000000000000002f12ee0773f3e3e29a3c99e5688ba00000000000000000000000000000000000000000000034528ae5e9bc615284b30000000000000000000000000000000000000000000000000000036ce62b902f0000000000000000000000000000000002ee2556626f422204f4929e401202130000000000000000000000000000000002d9b4c05b841f06b9f36dc3cb400000000000000000000000000000000000000002ec05e118202507041dcdb02757cb0000000000000000000000000000000000000007f3a3c9314b1b95e2f000000000000000000000000000000000000000000000000000016d5123ea1a77143bcb',
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
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0xf60becbba223eea9495da3f606753867ec10d139',
          data: '0x095ce6c5000000000000000000000000fd70de6b91282d8017aa4e741e9ae325cab992d80000000000000000000000007f1fa204bb700853d36994da19f830b6ad18455c000000000000000000000000f97f4df75117a78c1a5a0dbb814af92458539fb4000000000000000000000000f97f4df75117a78c1a5a0dbb814af92458539fb4000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e583100000000000000000000000000000000000000000000000000000e337e2b0f6600000000000000000000000000000000000000000000000000000e56448efd2100000000000000000000000000000000000000000000000000000e337e2b0f6600000000000000000000000000000000000000000000000000000e56448efd2100000000000000000000000000000000000000000000d3f851987ab37fa0000000000000000000000000000000000000000000000000d5075e88df90d8c00000ab15365d3aa743e766355e2557c230d8f943e195dc84d9b2b05928a07b635ee10000000000000000000000000000000000000000000000000000000000000000',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x00000000000000000000000000000000000000113eea3079ed4e1491f09d007900000000000000000000000000000000056fb45dda2d58ae05db60292f9349ef00000000000000000000000000000000005ca061d25c0c5175f5745f15a4f554ffffffffffffffffffffffffffffffffffde2b187969f5b5461e1869f09090ac00000000000000000000000000000000003acb7a4bc60206bc138cc9063586000000000000000000000000000000000000000000000034528ae5e9bc615284b30000000000000000000000000000000000000000000000000000036ce62b902f0000000000000000000000000000000002e709d3abf60a89b18a5a9800b85c520000000000000000000000000000000002d6144c612b298f5853ae9e6e600000000000000000000000000000000000000002ec06a65ba009d478ba62a9444d5e0000000000000000000000000000000000000007f3a3c9314b1b95e2f000000000000000000000000000000000000000000000000000016d5108b35fbc197bcb',
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
