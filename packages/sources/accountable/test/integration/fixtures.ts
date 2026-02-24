import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dvn.accountable.capital', {
    encodedQueryParams: true,
  })
    .get('/v1/reserves')
    .query({
      client: 'syrupusdc',
    })
    .reply(
      200,
      () => ({
        client: 'syrupUSDC',
        totalReserve: 39869034.71,
        totalSupply: 39676944.15,
        underlyingAssets: [
          { name: 'Copper', value: 37695400.26754955 },
          { name: 'Fireblocks', value: 2135159.12458195 },
          { name: 'Insurance Fund', value: 612614.08 },
          { name: 'Ethereum Chain', value: 35942.9508146177 },
          { name: 'Binance', value: 2524.0707870999145 },
          { name: 'BNB Smart Chain', value: 8.29771446758096 },
        ],
        collateralization: 1.004841,
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
    .persist()

export const mockResponseSuccessSyrupUsdt = (): nock.Scope =>
  nock('https://dvn.accountable.capital', {
    encodedQueryParams: true,
  })
    .get('/v1/reserves')
    .query({
      client: 'syrupusdt',
    })
    .reply(
      200,
      () => ({
        client: 'syrupUSDT',
        totalReserve: 15000000.5,
        totalSupply: 14500000.25,
        underlyingAssets: [
          { name: 'Copper', value: 12000000.5 },
          { name: 'Fireblocks', value: 3000000.0 },
        ],
        collateralization: 1.034482,
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
    .persist()

export const mockResponseEmptyData = (): nock.Scope =>
  nock('https://dvn.accountable.capital', {
    encodedQueryParams: true,
  })
    .get('/v1/reserves')
    .query({
      client: 'invalidclient',
    })
    .reply(200, null, ['Content-Type', 'application/json'])
    .persist()
