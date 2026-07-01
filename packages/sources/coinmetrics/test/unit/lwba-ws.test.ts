import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as queryString from 'querystring'
import { config } from '../../src/config'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/lwba'
import {
  calculateUrl,
  handleCryptoLwbaMessage,
  invalidBaseAssets,
  WsCryptoLwbaErrorResponse,
  WsCryptoLwbaSuccessResponse,
  WsCryptoLwbaWarningResponse,
} from '../../src/transport/lwba'

// Since the test is directly using endpoint functions, we need to initialize the logger here
LoggerFactoryProvider.set()

const EXAMPLE_SUCCESS_MESSAGE: WsCryptoLwbaSuccessResponse = {
  pair: 'eth-usd',
  time: Date.now().toString(),
  ask_price: '1500.5',
  ask_size: '20',
  bid_price: '1499.5',
  bid_size: '15',
  mid_price: '1500',
  spread: '1',
  cm_sequence_id: '9',
}

const EXAMPLE_WARNING_MESSAGE: WsCryptoLwbaWarningResponse = {
  warning: {
    type: 'warning',
    message: 'This is a warning message',
  },
}

const EXAMPLE_ERROR_MESSAGE: WsCryptoLwbaErrorResponse = {
  error: {
    type: 'error',
    message: 'This is an error message',
  },
}

const EXAMPLE_BAD_PARAMETER_ERROR_MESSAGE: WsCryptoLwbaErrorResponse = {
  error: {
    type: 'bad_parameter',
    message: "Bad parameter 'assets'. Value 'ohmv2' is not supported.",
  },
}

const EXAMPLE_REORG_MESSAGE = {
  time: Date.now().toString(),
  asset: 'eth',
  height: 99999,
  hash: 'nwiiwefepnfpnwiwiwfi',
  parent_hash: 'iriwwfnpfpuffp',
  type: 'reorg' as const,
  cm_sequence_id: 9,
}

config.initialize()
const EXAMPLE_CONTEXT: EndpointContext<BaseEndpointTypes> = {
  endpointName: 'crypto-lwba',
  inputParameters,
  adapterSettings: config.settings,
}

describe('lwba-ws url generator', () => {
  let oldEnv: NodeJS.ProcessEnv
  const invalidCurrencies = invalidBaseAssets

  beforeAll(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'someKey'
  })

  beforeEach(() => {
    invalidBaseAssets.length = 0
  })

  afterAll(() => {
    process.env = oldEnv
  })

  it('should correct casing in url', async () => {
    const url = await calculateUrl(EXAMPLE_CONTEXT, [
      {
        base: 'ETH',
        quote: 'usd',
      },
    ])
    expect(url).toContain(queryString.stringify({ assets: 'eth' }))
  })

  it('should compose the url using all desired subs', async () => {
    const url = await calculateUrl(EXAMPLE_CONTEXT, [
      {
        base: 'btc',
        quote: 'usd',
      },
      {
        base: 'eth',
        quote: 'EUR',
      },
    ])
    expect(url).toContain(new URLSearchParams({ assets: 'btc,eth' }).toString())
  })

  it('invalid request, should compose url without invalid asset', async () => {
    invalidCurrencies.push('usd')
    const url = await calculateUrl(EXAMPLE_CONTEXT, [
      {
        base: 'BTC',
        quote: 'USD',
      },
      {
        base: 'USD',
        quote: 'BTC',
      },
    ])
    expect(url).toContain(new URLSearchParams({ assets: 'btc' }).toString())
  })
})

describe('lwba-ws message handler', () => {
  beforeEach(() => {
    invalidBaseAssets.length = 0
  })

  it('success message results in value', () => {
    const res = handleCryptoLwbaMessage({ ...EXAMPLE_SUCCESS_MESSAGE })
    expect(res).toBeDefined()
    expect(res?.length).toEqual(1)
    expect(res?.[0].response.data.mid).toEqual(1500)
  })

  it('warning message results in undefined', () => {
    const res = handleCryptoLwbaMessage(EXAMPLE_WARNING_MESSAGE)
    expect(res).toBeUndefined()
  })

  it('error message results in undefined', () => {
    const res = handleCryptoLwbaMessage(EXAMPLE_ERROR_MESSAGE)
    expect(res).toBeUndefined()
  })

  it('bad parameter error stores the unsupported asset', () => {
    const res = handleCryptoLwbaMessage(EXAMPLE_BAD_PARAMETER_ERROR_MESSAGE)
    expect(res).toBeUndefined()
    expect(invalidBaseAssets).toContain('ohmv2')
  })

  it('reorg message results in undefined', () => {
    const res = handleCryptoLwbaMessage(EXAMPLE_REORG_MESSAGE)
    expect(res).toBeUndefined()
  })
})
