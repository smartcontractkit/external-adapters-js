import nock from 'nock'

export const mockPunksValueResponseSuccess = (): nock =>
  nock('https://jpegapi.com:443')
    .get('/punks?block=10000000&api_key=test-key')
    .reply(200, { success: true, block: 11000000, value: 5.568735828488373 }, [
      'Date',
      'Thu, 03 Mar 2022 00:58:49 GMT',
      'Content-Type',
      'application/json',
      'Transfer-Encoding',
      'chunked',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
    ])
