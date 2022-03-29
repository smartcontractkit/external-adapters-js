import nock from 'nock'

export const mockUSCPIResponseSuccess = (): nock =>
  nock('https://api.bls.gov/publicAPI/v2', { encodedQueryParams: true })
    .persist()
    .get('/timeseries/data/CUSR0000SA0')
    .reply(
      200,
      {
        status: 'REQUEST_SUCCEEDED',
        responseTime: 212,
        message: [],
        Results: {
          series: [
            {
              seriesID: 'CUSR0000SA0',
              data: [
                {
                  year: '2021',
                  period: 'M09',
                  periodName: 'September',
                  latest: 'true',
                  value: '274.138',
                  footnotes: [{}],
                },
                {
                  year: '2021',
                  period: 'M08',
                  periodName: 'August',
                  value: '273.012',
                  footnotes: [{}],
                },
                {
                  year: '2021',
                  period: 'M07',
                  periodName: 'July',
                  value: '272.265',
                  footnotes: [{}],
                },
              ],
            },
          ],
        },
      },
      [
        'Date',
        'Wed, 22 Sep 2021 14:24:17 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '152',
        'Connection',
        'close',
        'Server',
        'nginx',
        'Vary',
        'Origin',
      ],
    )

export const mockAuthenticatedSuccess = (): nock =>
  nock('https://api.bls.gov/publicAPI/v2', { encodedQueryParams: true })
    .get(`/timeseries/data/CUSR0000SA0?registrationkey=testkey`)
    .reply(
      200,
      {
        status: 'REQUEST_SUCCEEDED',
        responseTime: 212,
        message: [],
        Results: {
          series: [
            {
              seriesID: 'CUSR0000SA0',
              data: [
                {
                  year: '2021',
                  period: 'M09',
                  periodName: 'September',
                  latest: 'true',
                  value: '274.138',
                  footnotes: [{}],
                },
                {
                  year: '2021',
                  period: 'M08',
                  periodName: 'August',
                  value: '273.012',
                  footnotes: [{}],
                },
                {
                  year: '2021',
                  period: 'M07',
                  periodName: 'July',
                  value: '271.123', // Using a different value than the authenticated one, just to differentiate
                  footnotes: [{}],
                },
              ],
            },
          ],
        },
      },
      [
        'Date',
        'Wed, 22 Sep 2021 14:24:17 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '152',
        'Connection',
        'close',
        'Server',
        'nginx',
        'Vary',
        'Origin',
      ],
    )
