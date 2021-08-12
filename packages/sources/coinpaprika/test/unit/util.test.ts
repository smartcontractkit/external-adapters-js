import { getCoin } from '../../src/util'
import { ResponseSchema } from '../../src/endpoint/crypto'

describe('utils tests', () => {
  describe('getCoin', () => {
    const mockCoinList: ResponseSchema[] = [
      {
        id: "some_coin_decoy",
        name: "Some WRONG coin",
        symbol: "SOME",
        rank: 0,
        circulating_supply: 123,
        total_supply: 123,
        max_supply: 123,
        beta_value: 1,
        first_data_at: "",
        last_updated: "",
        quotes: {}
      },
      {
        id: "some_coin",
        name: "Some coin",
        symbol: "SOME",
        rank: 1,
        circulating_supply: 123,
        total_supply: 123,
        max_supply: 123,
        beta_value: 1,
        first_data_at: "",
        last_updated: "",
        quotes: {}
  }
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
