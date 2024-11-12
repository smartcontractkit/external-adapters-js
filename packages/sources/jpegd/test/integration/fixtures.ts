import nock from 'nock'

export const mockPunksValueResponseSuccess = (): nock.Scope =>
  nock('https://jpegapi.com')
    .get('/punks')
    .query({
      block: 14000000,
      api_key: 'test-key',
    })
    .reply(
      200,
      () => ({
        success: true,
        block: 14000000,
        value: 14000000,
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

export const mockCollectionsValueResponseSuccess = (): nock.Scope =>
  nock('https://jpegapi.com')
    .get('/api/v1/collections/jpeg-cards/values/latest')
    .query({
      api_key: 'test-key',
    })
    .reply(
      200,
      () => ({
        success: true,
        block: 14000000,
        value: 69000000,
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
