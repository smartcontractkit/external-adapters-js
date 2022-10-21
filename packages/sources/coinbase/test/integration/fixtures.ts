import nock from 'nock'

export const mockRateResponseSuccess = (): nock.Scope =>
  nock('https://api.coinbase.com')
    .get('/v2/prices/BTC-USD/spot')
    .query({ symbol: 'BTC', convert: 'USD' })
    .reply(200, () => ({ data: { base: 'BTC', currency: 'USD', amount: '57854.29' } }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])

export const mockNftResponseSuccess = (): nock.Scope =>
  nock('http://fake-nft.endpoint')
    .get('/api/nft/quant/v1/GetCollectionLatestMetric')
    .query({
      networkName: 'ethereum-mainnet',
      contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      metricName: 'ETH_FLOOR_PRICE_ESTIMATE_BASE',
    })
    .reply(
      200,
      {
        value: { floor_price_estimate: '67.09079293', updated_at: '2022-09-09T06:12:31Z' },
        metricName: 'eth_floor_price_estimate_base',
      },
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
