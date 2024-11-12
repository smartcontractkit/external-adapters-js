import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://lightnode-testnet.herokuapp.com')
    .post('/', { method: 'ren_queryShards', params: {}, id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      () => ({
        jsonrpc: '2.0',
        id: '1',
        result: {
          shards: [
            {
              darknodesRootHash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              gateways: [
                {
                  asset: 'BTC',
                  hosts: ['Ethereum'],
                  locked: '0',
                  origin: 'Bitcoin',
                  pubKey: 'Aw3WX32ykguyKZEuP0IT3RUOX5csm3PpvnFNhEVhrDVc',
                },
                {
                  asset: 'ZEC',
                  hosts: ['Ethereum'],
                  locked: '0',
                  origin: 'Zcash',
                  pubKey: 'Aw3WX32ykguyKZEuP0IT3RUOX5csm3PpvnFNhEVhrDVc',
                },
                {
                  asset: 'BCH',
                  hosts: ['Ethereum'],
                  locked: '0',
                  origin: 'BitcoinCash',
                  pubKey: 'Aw3WX32ykguyKZEuP0IT3RUOX5csm3PpvnFNhEVhrDVc',
                },
              ],
              gatewaysRootHash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              primary: true,
              pubKey: 'Aw3WX32ykguyKZEuP0IT3RUOX5csm3PpvnFNhEVhrDVc',
            },
          ],
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
