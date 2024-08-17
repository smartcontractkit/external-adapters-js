import nock from 'nock'

export const mockTradinghoursOpen = (market: string): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(200, {
      result: 2,
      statusCode: 200,
      data: {
        result: 2,
      },
    })
}

export const mockTradinghoursClosed = (market: string): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(200, {
      result: 1,
      statusCode: 200,
      data: {
        result: 1,
      },
    })
}

export const mockTradinghoursUnknown = (market: string): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(200, {
      result: 0,
      statusCode: 200,
      data: {
        result: 0,
      },
    })
}

export const mockTradinghoursError = (market: string): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(500, {})
}

export const mockNCFXOpen = (market: string): nock.Scope => {
  return nock('https://ncfx-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(200, {
      result: 2,
      statusCode: 200,
      data: {
        result: 2,
      },
    })
}

export const mockNCFXUnknown = (market: string): nock.Scope => {
  return nock('https://ncfx-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(200, {
      result: 0,
      statusCode: 200,
      data: {
        result: 0,
      },
    })
}

export const mockNCFXError = (market: string): nock.Scope => {
  return nock('https://ncfx-adapter.com')
    .persist()
    .post('/', { data: { endpoint: 'market-status', market } })
    .reply(500, {})
}
