import nock from 'nock'

export const mockTradinghoursOpen = (): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .post('/')
    .reply(200, {
      result: 2,
      statusCode: 200,
      data: {
        result: 2,
      },
    })
}

export const mockTradinghoursClosed = (): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .post('/')
    .reply(200, {
      result: 1,
      statusCode: 200,
      data: {
        result: 1,
      },
    })
}

export const mockTradinghoursUnknown = (): nock.Scope => {
  return nock('https://tradinghours-adapter.com')
    .post('/')
    .reply(200, {
      result: 0,
      statusCode: 200,
      data: {
        result: 0,
      },
    })
}

export const mockTradinghoursError = (): nock.Scope => {
  return nock('https://tradinghours-adapter.com').post('/').reply(500, {})
}

export const mockNCFXOpen = (): nock.Scope => {
  return nock('https://ncfx-adapter.com')
    .post('/')
    .reply(200, {
      result: 2,
      statusCode: 200,
      data: {
        result: 2,
      },
    })
}

export const mockNCFXUnknown = (): nock.Scope => {
  return nock('https://ncfx-adapter.com')
    .post('/')
    .reply(200, {
      result: 0,
      statusCode: 200,
      data: {
        result: 0,
      },
    })
}

export const mockNCFXError = (): nock.Scope => {
  return nock('https://ncfx-adapter.com').post('/').reply(500, {})
}
