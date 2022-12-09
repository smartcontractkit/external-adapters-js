import nock from 'nock'

export const mockSubscribeResponse = (apiKey: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .persist()
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'subscribe',
      stream: 'index',
      symbol: 'ETH-USD',
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockUnsubscribeResponse = (apiKey: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .persist()
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'unsubscribe',
      stream: 'index',
      symbol: 'ETH-USD',
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockSubscribeError = (apiKey: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .persist()
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'subscribe',
      stream: 'index',
      symbol: 'XXX-USD',
      index_freq: 1000,
    })
    .reply(400, {
      error: {
        code: 400,
        message: 'Symbol is not supported',
        errors: [
          {
            domain: 'stream',
          },
        ],
      },
    })
}
