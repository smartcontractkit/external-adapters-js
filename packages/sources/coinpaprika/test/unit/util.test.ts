import { getCoin, getSymbolToId } from '../../src/util'
import { ResponseSchema } from '../../src/endpoint/crypto'
import { makeConfig } from '../../src/config'

describe('config tests', () => {
  beforeEach(() => {
    delete process.env['API_KEY']
    delete process.env['IS_TEST_MODE']
  })

  describe('makeConfig', () => {
    it('does not use an API key if none is set', () => {
      const config = makeConfig()
      expect(config.api.headers['Authorization']).toBeUndefined()
    })

    it('does not start the adapter in test mode if the IS_IN_TEST_MODE env var is not set', () => {
      const config = makeConfig()
      const testModeHeader = config.api.headers['COINPAPRIKA-API-KEY-VERIFY']
      expect(testModeHeader).toBeUndefined()
    })

    it('uses an API key if one is set', () => {
      process.env.API_KEY = 'test-key'
      const config = makeConfig()
      const authHeader = config.api.headers['Authorization']
      expect(authHeader).toEqual(process.env.API_KEY)
    })

    it('starts the adapter in test mode if the IS_IN_TEST_MODE env var is set', () => {
      process.env.IS_TEST_MODE = 'true'
      const config = makeConfig()
      const testModeHeader = config.api.headers['COINPAPRIKA-API-KEY-VERIFY']
      expect(testModeHeader).toBe('true')
    })

    it('does not start the adapter in test mode if the IS_IN_TEST_MODE env var is set to false', () => {
      process.env.IS_TEST_MODE = 'false'
      const config = makeConfig()
      const testModeHeader = config.api.headers['COINPAPRIKA-API-KEY-VERIFY']
      expect(testModeHeader).toBeUndefined()
    })
  })
})

describe('utils tests', () => {
  describe('getCoin', () => {
    const mockCoinList: ResponseSchema[] = [
      {
        id: 'some_coin_decoy',
        name: 'Some WRONG coin',
        symbol: 'SOME',
        rank: 0,
        circulating_supply: 123,
        total_supply: 123,
        max_supply: 123,
        beta_value: 1,
        first_data_at: '',
        last_updated: '',
        quotes: {},
      },
      {
        id: 'some_coin',
        name: 'Some coin',
        symbol: 'SOME',
        rank: 1,
        circulating_supply: 123,
        total_supply: 123,
        max_supply: 123,
        beta_value: 1,
        first_data_at: '',
        last_updated: '',
        quotes: {},
      },
    ]

    it('returns a coin from a symbol', () => {
      const coin = getCoin(mockCoinList, 'SOME')
      expect(coin.id).toEqual('some_coin')
    })

    it('returns a coin from a coin id', () => {
      const coin = getCoin(mockCoinList, undefined, 'some_coin')
      expect(coin.id).toEqual('some_coin')
    })

    it('throw when symbol is not found', () => {
      expect(getCoin(mockCoinList, 'NOT_REAL')).toBeUndefined()
    })

    it('throw when coin id is not found', () => {
      expect(getCoin(mockCoinList, undefined, 'NOT_REAL')).toBeUndefined()
    })
  })
})

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
