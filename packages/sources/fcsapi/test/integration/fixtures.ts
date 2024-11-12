import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://fcsapi.com/api-v3', {
    encodedQueryParams: true,
  })
    .get('/stock/indices_latest')
    .query({ access_key: 'fake-api-key', id: '529' })
    .reply(
      200,
      () => ({
        status: true,
        code: 200,
        msg: 'Successfully',
        response: [
          {
            c: '7274.81',
            h: '7288.62',
            l: '7240.02',
            ch: '-13.81',
            cp: '-0.19%',
            t: '1635870898',
            name: 'FTSE 100',
            cty: 'united-kingdom',
            id: '529',
            tm: '2021-11-02 16:34:58',
          },
        ],
        info: { server_time: '2021-11-02 19:53:34 UTC', credit_count: 1 },
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
