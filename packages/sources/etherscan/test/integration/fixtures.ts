import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.etherscan.io')
    .get('/api')
    .query({ module: 'gastracker', action: 'gasoracle', apikey: 'fake-api-key' })
    .reply(
      200,
      () => ({
        status: '1',
        message: 'OK',
        result: {
          LastBlock: '13684787',
          SafeGasPrice: '125',
          ProposeGasPrice: '126',
          FastGasPrice: '128',
          suggestBaseFee: '124.91691221',
          gasUsedRatio:
            '0.999621963428153,0.905362133333333,0.144862633333333,0.503806366416528,0.0339690661700973',
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
