import nock from 'nock'

export const mockPunksValueResponseSuccess = (): nock =>
  nock('https://jpegapi.com')
    .get('/punks')
    .query({
      block: 14000000,
      api_key: 'test-key',
    })
    .reply(
      200,
      (_, request) => ({
        success: true,
        block: '14000000',
        value: '14000000',
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
