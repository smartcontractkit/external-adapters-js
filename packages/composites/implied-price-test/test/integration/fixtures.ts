import nock from 'nock'

export const mockDPResponseSuccess = (dp: string, value): nock.Scope =>
  nock('http://localhost:8080')
    .post(`/${dp}`, (body) => {
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(200, () => ({
      result: value,
      statusCode: 200,
      data: { result: value },
      timestamps: {
        providerDataReceivedUnixMs: Date.now(),
        providerDataStreamEstablishedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Date.now(),
      },
    }))
    .persist()

export const mockDPResponseError = (dp: string, value): nock.Scope =>
  nock('http://localhost:8080')
    .post(`/${dp}`, (body) => {
      return body && typeof body.data === 'object' && body.data !== null
    })
    .reply(400, () => ({
      status: 'errored',
      statusCode: 500,
      error: {
        name: 'AdapterError',
        message: 'Error',
      },
    }))
    .persist()
