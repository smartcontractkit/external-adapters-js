import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://www.cfbenchmarks.com/api', {
    reqheaders: {
      Authorization: 'Basic ZmFrZS1hcGktdXNlcm5hbWU6ZmFrZS1hcGktcGFzc3dvcmQ=',
    },
  })
    .get('/v1/values?id=BRTI')
    .reply(
      200,
      (_, request) => ({
        serverTime: '2022-02-18T16:53:55.772Z',
        payload: [
          { value: '39829.42', time: 1645199636000 },
          { value: '39829.30', time: 1645199637000 },
        ],
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

export const mockSubscribeResponse = {
  request: {
    type: 'subscribe',
    id: 'BRTI',
    stream: 'value',
    cacheID: 'BRTI',
  },
  response: [
    {
      type: 'value',
      time: 1645203822000,
      id: 'BRTI',
      value: '40067.00',
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: {
    type: 'unsubscribe',
    id: 'BRTI',
    stream: 'value',
    cacheID: 'BRTI',
  },
  response: [
    {
      type: 'unsubscribe',
      id: 'BRTI',
      stream: 'value',
      success: true,
    },
  ],
}
