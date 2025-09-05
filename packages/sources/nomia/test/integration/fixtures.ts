import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/')
    .query(() => true)
    .reply(
      200,
      () => ({
        Response: {
          Results: {
            Data: [
              {
                DataValue: '100',
                LineNumber: '1',
                TableName: 'Table1',
                TimePeriod: '2023-01',
              },
            ],
          },
        },
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
