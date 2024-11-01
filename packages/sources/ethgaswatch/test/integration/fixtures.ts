import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://ethgas.watch')
    .get('/api/gas')
    .reply(
      200,
      () => ({
        slow: { gwei: 141, usd: 13.42 },
        normal: { gwei: 148, usd: 14.09 },
        fast: { gwei: 170, usd: 16.18 },
        instant: { gwei: 192, usd: 18.28 },
        ethPrice: 4533.01,
        lastUpdated: 1637862962320,
        sources: [
          {
            name: 'Etherscan',
            source: 'https://etherscan.io/gastracker',
            fast: 145,
            standard: 144,
            slow: 144,
            lastBlock: 13684916,
          },
          {
            name: 'Gas station',
            source: 'https://ethgasstation.info/',
            instant: 183,
            fast: 172,
            standard: 148,
            slow: 132,
            lastBlock: 13684915,
          },
          {
            name: 'MyCrypto',
            source: 'https://gas.mycryptoapi.com/',
            instant: 208,
            fast: 168,
            standard: 148,
            slow: 138,
            lastBlock: 13684915,
          },
          {
            name: 'Upvest',
            source: 'https://doc.upvest.co/reference#ethereum-fees',
            instant: 192,
            fast: 192,
            standard: 166,
            slow: 162,
            lastUpdate: 1637862962296,
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
