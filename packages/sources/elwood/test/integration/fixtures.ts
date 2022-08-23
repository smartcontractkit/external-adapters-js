import nock from 'nock'

export const mockSubscribeResponse = (): nock => {
  nock('https://api.chk.elwood.systems:443', { encodedQueryParams: true })
    .persist()
    .post('/v1/stream', {
      action: 'subscribe',
      stream: 'index',
      symbol: 'ETH-USD',
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockUnsubscribeResponse = (): nock => {
  nock('https://api.chk.elwood.systems:443', { encodedQueryParams: true })
    .persist()
    .post('/v1/stream', {
      action: 'unsubscribe',
      stream: 'index',
      symbol: 'ETH-USD',
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockSubscribeWSResponse = {
  request: { action: 'subscribe', stream: 'index', symbol: 'ETH-USD', index_freq: 1000 },
  response: [
    { type: 'heartbeat', data: '2022-08-22T10:58:30.537993108Z', sequence: 1 },
    {
      type: 'Index',
      data: { price: '10000.000', symbol: 'ETH-USD', timestamp: '2022-08-22T10:58:34.31724727Z' },
      sequence: 2,
    },
  ],
}

export const mockUnsubscribeWSResponse = {
  request: { action: 'unsubscribe', stream: 'index', symbol: 'ETH-USD', index_freq: 1000 },
  response: [{ type: 'heartbeat', data: '2022-08-22T10:58:30.537993108Z', sequence: 3 }],
}
