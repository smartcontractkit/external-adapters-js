import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://www.cfbenchmarks.com/api', {
    reqheaders: {
      Authorization: 'Basic ZmFrZS1hcGktdXNlcm5hbWU6ZmFrZS1hcGktcGFzc3dvcmQ=',
    },
  })
    .get('/v1/values?id=BRTI')
    .reply(
      200,
      () => ({
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

export const mockBircResponseSuccess = (): nock.Scope => {
  const currentDayIsoString = new Date().toISOString()
  const currentDayTimestampMs = new Date(currentDayIsoString).getTime()
  return nock('https://www.cfbenchmarks.com/api', {
    reqheaders: {
      Authorization: 'Basic ZmFrZS1hcGktdXNlcm5hbWU6ZmFrZS1hcGktcGFzc3dvcmQ=',
    },
  })
    .get('/v1/curves')
    .query({ id: 'BIRC' })
    .reply(
      200,
      {
        serverTime: '2023-02-24T08:17:17.446Z',
        payload: [
          {
            tenors: {
              SIRB: '0.0986',
              '1W': '0.0077',
              '2W': '0.0186',
              '3W': '0.0219',
              '1M': '0.0168',
              '2M': '0.0099',
              '3M': '0.0097',
              '4M': '0.0078',
              '5M': '0.0059',
            },
            time: currentDayTimestampMs,
          },
          {
            tenors: {
              SIRB: '0.0947',
              '1W': '0.0367',
              '2W': '0.0185',
              '3W': '0.0229',
              '1M': '0.0274',
              '2M': '0.0297',
              '3M': '0.0275',
              '4M': '0.0253',
              '5M': '0.0000',
            },
            time: currentDayTimestampMs,
          },
        ],
      },
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
}

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
