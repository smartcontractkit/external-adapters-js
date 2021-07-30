import { getSymbolToId } from '../../src/util'

describe('utils tests', () => {
  describe('getSymbolToId', () => {
    const mockCoinList = [
      {
        id: 'btc-bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        rank: 1,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'eth-ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        rank: 2,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'bnb-binance-coin',
        name: 'Binance Coin',
        symbol: 'BNB',
        rank: 3,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'xrp-xrp',
        name: 'XRP',
        symbol: 'XRP',
        rank: 4,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'doge-dogecoin',
        name: 'Dogecoin',
        symbol: 'DOGE',
        rank: 5,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'usdt-tether',
        name: 'Tether',
        symbol: 'USDT',
        rank: 6,
        is_new: false,
        is_active: true,
        type: 'token',
      },
      {
        id: 'dot-polkadot',
        name: 'Polkadot',
        symbol: 'DOT',
        rank: 8,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'ada-cardano',
        name: 'Cardano',
        symbol: 'ADA',
        rank: 7,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'bch-bitcoin-cash',
        name: 'Bitcoin Cash',
        symbol: 'BCH',
        rank: 9,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
      {
        id: 'ltc-litecoin',
        name: 'Litecoin',
        symbol: 'LTC',
        rank: 10,
        is_new: false,
        is_active: true,
        type: 'coin',
      },
    ]

    it('returns an id from a symbol', () => {
      const id = getSymbolToId('eth', mockCoinList)
      expect(id).toEqual('eth-ethereum')
    })
    it('throw when symbol is not found', () => {
      expect(() => getSymbolToId('unknown_symbol', mockCoinList)).toThrow()
    })
  })
})
