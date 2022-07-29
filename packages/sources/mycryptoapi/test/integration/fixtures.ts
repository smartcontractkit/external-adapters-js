import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://gas.mycryptoapi.com')
    .get('/')
    .reply(
      200,
      () => ({
        safeLow: 122,
        standard: 134,
        fast: 148,
        fastest: 160,
        blockNum: 13722866,
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
