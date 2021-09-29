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
      {
        score: '452.38',
      },
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
