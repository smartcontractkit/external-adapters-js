import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://fake-url', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        refRates: [
          {
            effectiveDate: '2024-12-05',
            type: 'SOFR',
            percentRate: 4.59,
            percentPercentile1: 4.55,
            percentPercentile25: 4.57,
            percentPercentile75: 4.65,
            percentPercentile99: 4.68,
            volumeInBillions: 2325,
            revisionIndicator: '',
          },
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
    .persist()
