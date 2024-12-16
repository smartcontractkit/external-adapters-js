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
