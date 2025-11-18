import nock from 'nock'

export const mockReserveAxisResponseSuccess = (): nock.Scope =>
  nock('http://test-endpoint-new?client=axis', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({ client: 'axis' })
    .reply(200, {
      client: 'axis',
      totalReserve: '40438382.35',
      totalSupply: '40355393.07',
      underlyingAssets: [
        { name: 'Copper', value: 20000000 },
        { name: 'Fireblocks', value: 20438382.35 },
        { name: 'Insurance Fund', value: 630502.74 },
        { name: 'Ethereum Chain', value: 76414.71688973988 },
        { name: 'Binance', value: 3095.5639951004273 },
        { name: 'BNB Smart Chain', value: 7.3854242495045 },
      ],
      collateralization: 1.002056,
    })
    .persist()

export const mockReserveUnitasResponseSuccess = (): nock.Scope =>
  nock('http://test-endpoint-new?client=unitas', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({ client: 'unitas' })
    .reply(200, {
      client: 'unitas',
      totalReserve: '25559832.85',
      totalSupply: '25559832.85',
      underlyingAssets: [
        { name: 'Solana', value: 18440848.73 },
        { name: 'Binance', value: 7118984.11 },
      ],
      collateralization: 1.00416,
    })
    .persist()
