import { Overrider } from '../../src/lib/modules/overrider'

describe('Overrider', () => {
  describe('isOverrideObj', () => {
    it('Returns false for improperly formatted overrides', () => {
      const badOverrides = { ETH: 'ethereum', BTC: 'bitcoin' }
      expect(Overrider.isOverrideObj(badOverrides)).toEqual(false)
    })
    it('Returns true for correctly formatted overrides', () => {
      const goodOverrides = {
        coingecko: { ETH: 'ethereum', BTC: 'bitcoin' },
        coinpaprika: { ETH: 'ethereum', BTC: 'bitcoin' },
        nomics: { ETH: 'ETH2', BTC: 'BTC2' },
      }
      expect(Overrider.isOverrideObj(goodOverrides)).toEqual(true)
    })
  })

  describe('invertRequestedCoinsObject', () => {
    it('Returns inverted RequestedCoins object', () => {
      const requestedCoins = { ETH: 'ethereum', BTC: 'bitcoin' }
      expect(Overrider.invertRequestedCoinsObject(requestedCoins)).toEqual({
        ethereum: 'ETH',
        bitcoin: 'BTC',
      })
    })
  })

  describe('convertRemainingSymbolsToIds', () => {
    it('Throws an error if no matching symbol is found', () => {
      const overriddenCoins = { ETH: 'ethereum', BTC: 'bitcoin' }
      const remainingSyms = ['ADA', 'SOL']
      const coinsResponse = [
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
        { id: 'fakeethereum', symbol: 'ETH', name: 'Fake Ethereum' },
      ]
      expect(() => {
        Overrider.convertRemainingSymbolsToIds(overriddenCoins, remainingSyms, coinsResponse)
      }).toThrow("Could not find a matching coin id for the symbol 'SOL'.")
    })
    it('Converts remaining symbols to ids', () => {
      const overriddenCoins = { ETH: 'ethereum', BTC: 'bitcoin' }
      const remainingSyms = ['ADA', 'SOL']
      const coinsResponse = [
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
        { id: 'fakeethereum', symbol: 'ETH', name: 'Fake Ethereum' },
        { id: 'solana', symbol: 'SOL', name: 'Solana' },
      ]
      expect(
        Overrider.convertRemainingSymbolsToIds(overriddenCoins, remainingSyms, coinsResponse),
      ).toEqual({ ETH: 'ethereum', BTC: 'bitcoin', ADA: 'cardano', SOL: 'solana' })
    })
    it("Uses first coin matched in DP provider's list if there is a duplicate", () => {
      const overriddenCoins = { ETH: 'ethereum', BTC: 'bitcoin' }
      const remainingSyms = ['SOL', 'ADA']
      const coinsResponse = [
        { id: 'fakecardano', symbol: 'ADA', name: 'Fake Cardano' },
        { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
        { id: 'solana', symbol: 'SOL', name: 'Solana' },
      ]
      expect(
        Overrider.convertRemainingSymbolsToIds(overriddenCoins, remainingSyms, coinsResponse),
      ).toEqual({
        SOL: 'solana',
        ADA: 'fakecardano',
        ETH: 'ethereum',
        BTC: 'bitcoin',
      })
    })
  })

  describe('performOverrides', () => {
    it('Performs overrides', () => {
      const internalOverrides = {
        coingecko: { ETH: 'ethereum', BTC: 'bitcoin' },
        coinpaprika: { ETH: 'ethereum', BTC: 'bitcoin' },
      }
      const inputOverrides = {
        coingecko: { ETH: 'ethereum2' },
        nomics: { ETH: 'ETH2', BTC: 'BTC2' },
      }
      const overrider = new Overrider(internalOverrides, inputOverrides, 'COINGECKO', '1')
      const [overriddenSyms, remainingSyms] = overrider.performOverrides(['BTC', 'ETH', 'ADA'])
      expect(overriddenSyms).toEqual({ BTC: 'bitcoin', ETH: 'ethereum2' })
      expect(remainingSyms).toEqual(['ADA'])
    })
  })
})
