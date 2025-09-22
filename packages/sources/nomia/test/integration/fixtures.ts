import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query((query) => query.TableName === 'Table1' && query.LineNumber === '1')
    .reply(
      200,
      () => ({
        BEAAPI: {
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

export const mockResponseBEAError = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query((query) => query.TableName === 'Table2' && query.LineNumber === '2')
    .reply(
      200,
      () => ({
        BEAAPI: {
          Results: {
            Error: {
              APIErrorCode: '40',
              APIErrorDescription: 'The Dataset requested does not exist',
            },
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
