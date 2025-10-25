import nock from 'nock'

export const mockCoingeckoSuccess = (): nock.Scope =>
  nock('http://localhost:8080/coingecko', {
    encodedQueryParams: true,
  })
    .post('/', (body) => {
      // Validate request body structure
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(200, () => ({
      result: 4400.05,
      statusCode: 200,
      data: { result: 4400.05 },
      timestamps: {
        providerDataReceivedUnixMs: Date.now(),
        providerDataStreamEstablishedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Date.now(),
      },
    }))
    .persist()

export const mockCoinpaprikaSuccess = (): nock.Scope =>
  nock('http://localhost:8080/coinpaprika', {
    encodedQueryParams: true,
  })
    .post('/', (body) => {
      // Validate request body structure
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(200, () => ({
      result: 4400.15,
      statusCode: 200,
      data: { result: 4400.15 },
      timestamps: {
        providerDataReceivedUnixMs: Date.now(),
        providerDataStreamEstablishedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Date.now(),
      },
    }))
    .persist()

export const mockCoinbaseSuccess = (): nock.Scope =>
  nock('http://localhost:8080/coinbase', {
    encodedQueryParams: true,
  })
    .post('/', (body) => {
      // Validate request body structure
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(200, () => ({
      result: 4399.95,
      statusCode: 200,
      data: { result: 4399.95 },
      timestamps: {
        providerDataReceivedUnixMs: Date.now(),
        providerDataStreamEstablishedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Date.now(),
      },
    }))
    .persist()

export const mockZeroAdapterSuccess = (): nock.Scope =>
  nock('http://localhost:8080/zero-adapter', {
    encodedQueryParams: true,
  })
    .post('/', (body) => {
      // Validate request body structure
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(200, () => ({
      result: 0,
      statusCode: 200,
      data: { result: 0 },
      timestamps: {
        providerDataReceivedUnixMs: Date.now(),
        providerDataStreamEstablishedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Date.now(),
      },
    }))
    .persist()

export const mockFailingAdapter = (): nock.Scope =>
  nock('http://localhost:8080/failing', {
    encodedQueryParams: true,
  })
    .post('/', (body) => {
      // Validate request body structure
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(500, () => ({ error: 'Source adapter error' }))
    .persist()

export const mockTimeoutAdapter = (): nock.Scope =>
  nock('http://localhost:8080/timeout', {
    encodedQueryParams: true,
  })
    .post('/', (body) => {
      // Validate request body structure
      return body && typeof body.data === 'object' && body.data !== null
    })
    .delay(30000) // Simulate timeout
    .reply(200, () => ({
      result: 1000,
      statusCode: 200,
      data: { result: 1000 },
    }))
    .persist()
