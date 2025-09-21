import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query(() => true)
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
    .query(() => true)
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

export const mockResponseBlacklistedKey = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query(() => true)
    .reply(
      200,
      () => ({
        BEAAPI: {
          Results: {
            Error: {
              APIErrorCode: '0',
              APIErrorDescription:
                'The API UserID being used has been disabled for activity that appears suspicious/malicious. Please contact us at Developers@bea.gov as soon as possible to discuss, and perhaps have it re-enabled.',
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

export const mockResponseNoData = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query(() => true)
    .reply(
      200,
      () => ({
        BEAAPI: {
          Results: {
            Data: [],
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

export const mockResponseMalformedBEA = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query(() => true)
    .reply(
      200,
      () => ({
        // Missing BEAAPI wrapper - malformed response
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

export const mockResponseEmptyObject = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query(() => true)
    .reply(
      200,
      () => ({}), // Empty object
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

export const mockResponseNonObject = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query(() => true)
    .reply(
      200,
      () => 'Not an object response', // String instead of object
      [
        'Content-Type',
        'text/plain',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
