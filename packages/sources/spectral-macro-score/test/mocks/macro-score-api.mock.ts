import nock from 'nock'

export function mockMacroScoreAPIResponseSuccess() {
  nock('https://xzff24vr3m.execute-api.us-east-2.amazonaws.com:443', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/default/spectral-proxy', {
      tokenInt: 'test',
    })
    .reply(
      200,
      [
        {
          address: '0xa55E01a40557fAB9d87F993d8f5344f1b2408072',
          score_aave: '604.77',
          score_comp: '300.00',
          score: '452.38',
          updated_at: '2021-07-18T21:07:56.219383Z',
          is_updating_aave: false,
          is_updating_comp: false,
        },
      ],
      [
        'Date',
        'Sun, 18 Jul 2021 21:08:00 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '212',
        'Connection',
        'close',
        'x-amzn-RequestId',
        'efecbd16-a8b0-4eba-8bbf-81fdf3d304af',
        'x-amz-apigw-id',
        'Cry2nHcoCYcFcHw=',
        'X-Amzn-Trace-Id',
        'Root=1-60f4982a-4cb4380e36fd98c6551c2d7a;Sampled=0',
      ],
    )
}
