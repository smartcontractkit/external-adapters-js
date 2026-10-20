import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as queryString from 'querystring'
import { config, VALID_QUOTES } from '../../src/config'
import { assetMetricsInputParameters, BaseEndpointTypes } from '../../src/endpoint/price'
import {
  calculateAssetMetricsUrl,
  handleAssetMetricsMessage,
  invalidBaseAssets,
  unsupportedAssetMetrics,
  WsAssetMetricsErrorResponse,
  WsAssetMetricsSuccessResponse,
  WsAssetMetricsWarningResponse,
} from '../../src/transport/price-ws'

//Since the test is directly using endpoint functions, we need to initialize the logger here
LoggerFactoryProvider.set()

const EXAMPLE_SUCCESS_MESSAGE: WsAssetMetricsSuccessResponse = {
  time: Date.now().toString(),
  asset: 'eth',
  height: 99999,
  hash: 'nwiiwefepnfpnwiwiwfi',
  parent_hash: 'iriwwfnpfpuffp',
  type: 'price',
  cm_sequence_id: 9,
  ReferenceRateUSD: '1500',
}

const EXAMPLE_WARNING_MESSAGE: WsAssetMetricsWarningResponse = {
  warning: {
    type: 'warning',
    message: 'This is a warning message',
  },
}
const EXAMPLE_ERROR_MESSAGE: WsAssetMetricsErrorResponse = {
  error: {
    type: 'error',
    message: 'This is an error message',
  },
}
const EXAMPLE_REORG_MESSAGE = {
  ...EXAMPLE_SUCCESS_MESSAGE,
  type: 'reorg',
}

config.initialize()
const EXAMPLE_CONTEXT: EndpointContext<BaseEndpointTypes> = {
  endpointName: 'price',
  inputParameters: assetMetricsInputParameters,
  adapterSettings: config.settings,
}

describe('price-ws url generator', () => {
  let oldEnv: NodeJS.ProcessEnv
  const invalid_currencies = invalidBaseAssets
  beforeAll(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'someKey'
  })
  afterAll(() => {
    process.env = oldEnv
  })

  it('should correct casing in url', async () => {
    const url = await calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
      {
        base: 'ETH'.toUpperCase(), //Deliberately use the wrong case
        //@ts-expect-error since we  are testing the failure exactly we need this so that the pipeline won't fail
        quote: 'usd'.toLowerCase(), //Deliberately use the wrong case
      },
    ])
    expect(url).toContain(queryString.stringify({ assets: 'eth' }))
    expect(url).toContain(queryString.stringify({ metrics: 'ReferenceRateUSD' }))
  })
  it('should compose the url using all desired subs', async () => {
    const url = await calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
      {
        base: 'btc', //Deliberately use the wrong case
        //@ts-expect-error since we  are testing the failure exactly we need this so that the pipeline won't fail
        quote: 'usd', //Deliberately use the wrong case
      },
      {
        base: 'eth', //Deliberately use the wrong case
        //@ts-expect-error since we  are testing the failure exactly we need this so that the pipeline won't fail
        quote: 'EUR', //Deliberately use the wrong case
      },
    ])
    expect(url).toContain(new URLSearchParams({ assets: 'btc,eth' }).toString())
    expect(url).toContain(
      new URLSearchParams({ metrics: 'ReferenceRateEUR,ReferenceRateUSD' }).toString(),
    )
  })

  it('invalid request, should compose url with invalid pair', async () => {
    invalid_currencies.push('usd')
    const url = await calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
      {
        base: 'BTC'.toUpperCase(),
        quote: VALID_QUOTES.USD,
      },
      {
        base: 'USD',
        quote: VALID_QUOTES.BTC,
      },
    ])
    expect(url).toContain(new URLSearchParams({ assets: 'btc' }).toString())
    expect(url).toContain(new URLSearchParams({ metrics: 'ReferenceRateUSD' }).toString())
  })
})

describe('price-ws message handler', () => {
  it('success message results in value', () => {
    const res = handleAssetMetricsMessage({ ...EXAMPLE_SUCCESS_MESSAGE })
    expect(res).toBeDefined()
    expect(res?.length).toEqual(1)
    expect(res?.[0].response.result).toEqual(1500)
  })

  it('warning message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_WARNING_MESSAGE)
    expect(res).toEqual([])
  })
  it('error message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_ERROR_MESSAGE)
    expect(res).toEqual([])
  })
  it('reorg message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_REORG_MESSAGE)
    expect(res).toEqual([])
  })
})

describe('price-ws bad parameter errors', () => {
  const UNSUPPORTED_METRIC =
    "Metric 'ReferenceRateBTC' with frequency '1s' is not supported for 'win'."
  const INVALID_ASSET = "Bad parameter 'assets'. Value 'ohmv2' is not supported."
  const badParameter = (type: string, message: string): WsAssetMetricsErrorResponse => ({
    error: { type, message },
  })
  const sub = (base: string, quote: VALID_QUOTES) => ({ base, quote })
  const params = (url: string) => new URL(url).searchParams

  beforeEach(() => {
    invalidBaseAssets.length = 0
    unsupportedAssetMetrics.clear()
  })

  it('invalid asset error (bad_parameter) leaves out the asset, as before', () => {
    handleAssetMetricsMessage(badParameter('bad_parameter', INVALID_ASSET))
    expect(invalidBaseAssets).toEqual(['ohmv2'])
    expect(unsupportedAssetMetrics.size).toEqual(0)
  })

  it('invalid asset error (bad_parameters) leaves out the asset', () => {
    handleAssetMetricsMessage(badParameter('bad_parameters', INVALID_ASSET))
    expect(invalidBaseAssets).toEqual(['ohmv2'])
  })

  it('unknown bad_parameter error keeps the old behavior', () => {
    handleAssetMetricsMessage(badParameter('bad_parameter', "Value 'a' and 'b' are not valid."))
    expect(invalidBaseAssets).toEqual(['b'])
  })

  it('unknown bad_parameter error with one value does not throw', () => {
    expect(() =>
      handleAssetMetricsMessage(badParameter('bad_parameter', "Value 'a' is not valid.")),
    ).not.toThrow()
    expect(invalidBaseAssets).toEqual([])
  })

  it('unknown bad_parameters error changes nothing', () => {
    handleAssetMetricsMessage(badParameter('bad_parameters', "Value 'a' and 'b' are not valid."))
    expect(invalidBaseAssets).toEqual([])
    expect(unsupportedAssetMetrics.size).toEqual(0)
  })

  it.each(['bad_parameters', 'bad_parameter'])(
    'unsupported metric error (%s) records the pair, not the asset',
    (type) => {
      handleAssetMetricsMessage(badParameter(type, UNSUPPORTED_METRIC))
      expect(invalidBaseAssets).toEqual([])
      expect([...(unsupportedAssetMetrics.get('win') ?? [])]).toEqual(['ReferenceRateBTC'])
    },
  )

  describe('url', () => {
    beforeEach(() => {
      handleAssetMetricsMessage(badParameter('bad_parameters', UNSUPPORTED_METRIC))
    })

    it('leaves out the asset while another sub has the unsupported metric', () => {
      const url = calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
        sub('WIN', VALID_QUOTES.USD),
        sub('ETH', VALID_QUOTES.USD),
        sub('ETH', VALID_QUOTES.BTC),
      ])
      expect(params(url).get('assets')).toEqual('eth')
      expect(params(url).get('metrics')).toEqual('ReferenceRateBTC,ReferenceRateUSD')
    })

    it('keeps the asset when no other sub has the unsupported metric', () => {
      const url = calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
        sub('WIN', VALID_QUOTES.USD),
        sub('WIN', VALID_QUOTES.BTC),
        sub('ETH', VALID_QUOTES.USD),
      ])
      expect(params(url).get('assets')).toEqual('eth,win')
      expect(params(url).get('metrics')).toEqual('ReferenceRateUSD')
    })

    it('does not change the url of subs without a recorded pair', () => {
      const url = calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
        sub('BTC', VALID_QUOTES.ETH),
        sub('ETH', VALID_QUOTES.BTC),
      ])
      expect(params(url).get('assets')).toEqual('btc,eth')
      expect(params(url).get('metrics')).toEqual('ReferenceRateBTC,ReferenceRateETH')
    })
  })
})
