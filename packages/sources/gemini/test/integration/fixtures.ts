import nock from 'nock'

export const mockGeminiResponseSuccess = (): nock =>
  nock('https://api.gemini.com:443', { encodedQueryParams: true })
    .persist()
    .get('/v1/tokens/efil/reserves')
    .reply(
      200,
      {
        addresses: [
          'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi',
          'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay',
        ],
        ethereum_supply: 33427.594125,
        currency: 'EFIL',
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
