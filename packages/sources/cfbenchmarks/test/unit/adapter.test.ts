import { getIdFromBaseQuote } from '../../src/utils'

describe('getIdFromBaseQuote', () => {
  const tests: {
    name: string
    input: { data: { base: string; quote: string } }
    output: string
    useSecondary: boolean
  }[] = [
    {
      name: 'uses base/quote if present',
      input: { data: { base: 'ETH', quote: 'USD' } },
      output: 'ETHUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'uses aliases base/quote if present',
      input: { data: { base: 'USDT', quote: 'USD' } },
      output: 'USDTUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'maps BTC/USD quote BRTI',
      input: { data: { base: 'BTC', quote: 'USD' } },
      output: 'BRTI',
      useSecondary: false,
    },
    {
      name: 'maps SOL/USD quote SOLUSD_RTI if not using secondary endpoint',
      input: { data: { base: 'SOL', quote: 'USD' } },
      output: 'SOLUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'maps SOL/USD quote U_SOLUSD_RTI if using secondary endpoint',
      input: { data: { base: 'SOL', quote: 'USD' } },
      output: 'U_SOLUSD_RTI',
      useSecondary: true,
    },
  ]

  tests.forEach((test) => {
    it(`${test.name}`, async () => {
      const type = test.useSecondary ? 'secondary' : 'primary'
      expect(getIdFromBaseQuote(test.input.data.base, test.input.data.quote, type)).toEqual(
        test.output,
      )
    })
  })
})
