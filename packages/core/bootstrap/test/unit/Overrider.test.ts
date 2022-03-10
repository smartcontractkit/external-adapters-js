import { Overrider } from '../../src/lib/modules'
import { OverrideObj, Override } from '@chainlink/types'

const createOverride = (overrides: OverrideObj): Override => {
  const overrideMap = new Map<string, Map<string, string>>()
  for (const adapterName of Object.keys(overrides)) {
    const adapterMap = new Map<string, string>()
    for (const overriddenSymbol of Object.keys(overrides[adapterName])) {
      adapterMap.set(overriddenSymbol, overrides[adapterName][overriddenSymbol])
    }
    overrideMap.set(adapterName, adapterMap)
  }
  return overrideMap
}

describe('Overrider', () => {
  it('Invert requested coins object', () => {
    const requestedCoins = { AAAA: 'coin-id-a', BBBB: 'coin-id-b', CCCC: 'coin-id-c' }
    const invertedCoins = Overrider.invertRequestedCoinsObject(requestedCoins)
    expect(invertedCoins).toEqual({ 'coin-id-a': 'AAAA', 'coin-id-b': 'BBBB', 'coin-id-c': 'CCCC' })
  })

  describe('One override at a time', () => {
    it('Symbol to id input override only', () => {
      const symbolToIdOverridesFromInput = createOverride({ coingecko: { AAAA: 'coin-id-a' } })
      const overrider = new Overrider({ symbolToIdOverridesFromInput }, 'COINGECKO')
      const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
      expect(requestedCoins).toEqual({ AAAA: 'coin-id-a' })
      expect(remainingSymbols).toEqual([])
    })
    it('Symbol to symbol input override only', () => {
      const overridesFromInput = createOverride({ coingecko: { AAAA: 'BBBB' } })
      const overrider = new Overrider({ overridesFromInput }, 'COINGECKO')
      const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
      expect(requestedCoins).toEqual({})
      expect(remainingSymbols).toEqual(['BBBB'])
    })
    it('Symbol to id adapter override only', () => {
      const symbolToIdOverridesFromAdapter = createOverride({ coingecko: { AAAA: 'coin-id-a' } })
      const overrider = new Overrider({ symbolToIdOverridesFromAdapter }, 'COINGECKO')
      const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
      expect(requestedCoins).toEqual({ AAAA: 'coin-id-a' })
      expect(remainingSymbols).toEqual([])
    })
    it('Symbol to symbol adapter override only', () => {
      const overridesFromAdapter = createOverride({ coingecko: { AAAA: 'BBBB' } })
      const overrider = new Overrider({ overridesFromAdapter }, 'COINGECKO')
      const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
      expect(requestedCoins).toEqual({})
      expect(remainingSymbols).toEqual(['BBBB'])
    })
  })

  describe('Combined overrides', () => {
    describe('Single coins', () => {
      it('Duplicated symbol to id override provided by both input and adapter', () => {
        const symbolToIdOverridesFromInput = createOverride({
          coingecko: { AAAA: 'coin-id-1' },
        })
        const symbolToIdOverridesFromAdapter = createOverride({
          coingecko: { AAAA: 'coin-id-2' },
        })
        const overrider = new Overrider(
          {
            symbolToIdOverridesFromInput,
            symbolToIdOverridesFromAdapter,
          },
          'COINGECKO',
        )
        const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
        expect(requestedCoins).toEqual({ AAAA: 'coin-id-1' })
        expect(remainingSymbols).toEqual([])
      })
      it('Duplicated symbol to symbol override provided by both input and adapter', () => {
        const overridesFromInput = createOverride({
          coingecko: { AAAA: 'BBBB', BBBB: 'EEEE' },
        })
        const overridesFromAdapter = createOverride({
          coingecko: { BBBB: 'CCCC', AAAA: 'DDDD' },
        })
        const overrider = new Overrider(
          {
            overridesFromInput,
            overridesFromAdapter,
          },
          'COINGECKO',
        )
        const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
        expect(requestedCoins).toEqual({})
        expect(remainingSymbols).toEqual(['CCCC'])
      })
      it('Duplicated symbol to symbol and symbol to id override provided by both input and adapter', () => {
        const symbolToIdOverridesFromInput = createOverride({
          coingecko: { AAAA: 'coin-id-1' },
        })
        const symbolToIdOverridesFromAdapter = createOverride({
          coingecko: { AAAA: 'coin-id-2' },
        })
        const overridesFromInput = createOverride({
          coingecko: { AAAA: 'BBBB', BBBB: 'EEEE' },
        })
        const overridesFromAdapter = createOverride({
          coingecko: { BBBB: 'CCCC', AAAA: 'DDDD' },
        })
        const overrider = new Overrider(
          {
            symbolToIdOverridesFromInput,
            symbolToIdOverridesFromAdapter,
            overridesFromInput,
            overridesFromAdapter,
          },
          'COINGECKO',
        )
        const [requestedCoins, remainingSymbols] = overrider.performOverrides('AAAA')
        expect(requestedCoins).toEqual({ AAAA: 'coin-id-1' })
        expect(remainingSymbols).toEqual([])
      })
    })

    describe('Multiple coins', () => {
      it('Duplicated symbol to id override provided by both input and adapter', () => {
        const symbolToIdOverridesFromInput = createOverride({
          coingecko: { AAAA: 'coin-id-1' },
        })
        const symbolToIdOverridesFromAdapter = createOverride({
          coingecko: { AAAA: 'coin-id-2', BBBB: 'coin-id-3' },
        })
        const overrider = new Overrider(
          {
            symbolToIdOverridesFromInput,
            symbolToIdOverridesFromAdapter,
          },
          'COINGECKO',
        )
        const [requestedCoins, remainingSymbols] = overrider.performOverrides(['AAAA', 'BBBB'])
        expect(requestedCoins).toEqual({ AAAA: 'coin-id-1', BBBB: 'coin-id-3' })
        expect(remainingSymbols).toEqual([])
      })
      it('Duplicated symbol to symbol override provided by both input and adapter', () => {
        const overridesFromInput = createOverride({
          coingecko: { AAAA: 'BBBB', BBBB: 'EEEE', CCCC: 'HHHH' },
        })
        const overridesFromAdapter = createOverride({
          coingecko: { BBBB: 'CCCC', AAAA: 'DDDD', FFFF: 'GGGG' },
        })
        const overrider = new Overrider(
          {
            overridesFromInput,
            overridesFromAdapter,
          },
          'COINGECKO',
        )
        const [requestedCoins, remainingSymbols] = overrider.performOverrides(['AAAA', 'FFFF'])
        expect(requestedCoins).toEqual({})
        expect(remainingSymbols).toEqual(['HHHH', 'GGGG'])
      })
      it('Duplicated symbol to symbol and symbol to id override provided by both input and adapter', () => {
        const symbolToIdOverridesFromInput = createOverride({
          coingecko: { AAAA: 'coin-id-1', GGGG: 'coin-id-5' },
        })
        const symbolToIdOverridesFromAdapter = createOverride({
          coingecko: { AAAA: 'coin-id-2', BBBB: 'coin-id-3', EEEE: 'coin-id-4' },
        })
        const overridesFromInput = createOverride({
          coingecko: { AAAA: 'BBBB', BBBB: 'EEEE', CCCC: 'HHHH' },
        })
        const overridesFromAdapter = createOverride({
          coingecko: { BBBB: 'CCCC', AAAA: 'DDDD', FFFF: 'GGGG', HHHH: 'IIII' },
        })
        const overrider = new Overrider(
          {
            symbolToIdOverridesFromInput,
            symbolToIdOverridesFromAdapter,
            overridesFromInput,
            overridesFromAdapter,
          },
          'COINGECKO',
        )
        const [requestedCoins, remainingSymbols] = overrider.performOverrides([
          'AAAA',
          'BBBB',
          'FFFF',
          'CCCC',
        ])
        expect(requestedCoins).toEqual({ AAAA: 'coin-id-1', EEEE: 'coin-id-4', GGGG: 'coin-id-5' })
        expect(remainingSymbols).toEqual(['IIII'])
      })
    })
  })

  describe('Convert remaining symbols to ids', () => {
    const dataProviderCoinsResponse = [
      { symbol: 'AAAA', id: 'coin-id-a', name: 'coin-a' },
      { symbol: 'BBBB', id: 'coin-id-b', name: 'coin-b' },
      { symbol: 'CCCC', id: 'coin-id-c', name: 'coin-c' },
      { symbol: 'DDDD', id: 'overridden-coin-id', name: 'overridden-coin-c' },
    ]
    it("Symbol to id conversion from data provider's coin list", () => {
      const overrider = new Overrider({}, 'COINGECKO')
      const requestedCoins = overrider.convertRemainingSymbolsToIds(
        ['BBBB'],
        dataProviderCoinsResponse,
        { CCCC: 'overridden-coin-id' },
      )
      expect(requestedCoins).toEqual({ CCCC: 'overridden-coin-id', BBBB: 'coin-id-b' })
    })
  })

  describe('Failure cases for overrides', () => {
    it('Symbol to id override causes a duplicate coin id', () => {
      const symbolToIdOverridesFromInput = createOverride({
        coingecko: { AAAA: 'duplicated-coin-id' },
      })
      const symbolToIdOverridesFromAdapter = createOverride({
        coingecko: { BBBB: 'duplicated-coin-id' },
      })
      const overrider = new Overrider(
        {
          symbolToIdOverridesFromAdapter,
          symbolToIdOverridesFromInput,
        },
        'COINGECKO',
      )
      expect(() => {
        overrider.performOverrides(['AAAA', 'BBBB'])
      }).toThrow("A duplicate was detected for the coin id 'duplicated-coin-id'.")
    })
    it('Symbol to symbol override causes a duplicate symbol', () => {
      const overridesFromInput = createOverride({
        coingecko: { AAAA: 'BBBB' },
      })
      const overrider = new Overrider({ overridesFromInput }, 'COINGECKO')
      expect(() => {
        overrider.performOverrides(['AAAA', 'BBBB'])
      }).toThrow(
        "A duplicate was detected when attemping performing an override from 'AAAA' to 'BBBB'",
      )
    })
    it('Symbol to symbol override causes a duplicate coin id when performing symbol to id override', () => {
      const symbolToIdOverridesFromInput = createOverride({
        coingecko: { AAAA: 'duplicated-coin-id' },
      })
      const overridesFromInput = createOverride({
        coingecko: { BBBB: 'CCCC' },
      })
      const symbolToIdOverridesFromAdapter = createOverride({
        coingecko: { CCCC: 'duplicated-coin-id' },
      })
      const overrider = new Overrider(
        {
          symbolToIdOverridesFromInput,
          overridesFromInput,
          symbolToIdOverridesFromAdapter,
        },
        'COINGECKO',
      )
      expect(() => {
        overrider.performOverrides(['AAAA', 'BBBB'])
      }).toThrow("A duplicate was detected for the coin id 'duplicated-coin-id'.")
    })
  })

  describe('Failure cases for converting remaining symbols to ids', () => {
    const dataProviderCoinsResponse = [
      { symbol: 'AAAA', id: 'coin-id-a', name: 'coin-a' },
      { symbol: 'AAAA', id: 'duplicated-coin-id', name: 'duplicated-coin-a' },
      { symbol: 'BBBB', id: 'coin-id-b', name: 'coin-b' },
      { symbol: 'CCCC', id: 'coin-id-c', name: 'coin-c' },
      { symbol: 'DDDD', id: 'overridden-coin-id', name: 'overridden-coin-c' },
    ]
    const overrider = new Overrider({}, 'COINGECKO')
    it("Symbol does not exist in data provider's coin list", () => {
      expect(() => {
        overrider.convertRemainingSymbolsToIds(['BBBB', 'ZZZZ'], dataProviderCoinsResponse, {})
      }).toThrow("Could not find a coin id for the requested symbol 'ZZZZ'")
    })
    it("Duplicated symbol in the data provider's coin list", () => {
      expect(() => {
        overrider.convertRemainingSymbolsToIds(['AAAA', 'BBBB'], dataProviderCoinsResponse, {})
      }).toThrow("A duplicate symbol was found for the requested symbol 'AAAA'.")
    })
    it('Duplicated symbol from the overrides', () => {
      expect(() => {
        overrider.convertRemainingSymbolsToIds(['BBBB', 'CCCC'], dataProviderCoinsResponse, {
          BBBB: 'overridden-coin-id',
        })
      }).toThrow("The coin id 'overridden-coin-id' already exists for the symbol 'BBBB'.")
    })
    it('Duplicated coin id from the overrides', () => {
      expect(() => {
        overrider.convertRemainingSymbolsToIds(['BBBB', 'CCCC'], dataProviderCoinsResponse, {
          AAAA: 'coin-id-b',
        })
      }).toThrow("The coin id 'coin-id-b' was duplicated in the request.")
    })
  })
})
