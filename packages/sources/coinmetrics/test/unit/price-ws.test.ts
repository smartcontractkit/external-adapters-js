import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import * as queryString from 'querystring'
import { config, VALID_QUOTES } from '../../src/config'
import {
  calculateAssetMetricsUrl,
  handleAssetMetricsMessage,
  WsAssetMetricsErrorResponse,
  WsAssetMetricsSuccessResponse,
  WsAssetMetricsWarningResponse,
  invalidBaseAssets,
} from '../../src/transport/price-ws'
import { assetMetricsInputParameters, BaseEndpointTypes } from '../../src/endpoint/price'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'

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
const EXAMPLE_BAD_PARAMETER_ERROR_MESSAGE: WsAssetMetricsErrorResponse = {
  error: {
    type: 'bad_parameter',
    message: "Bad parameter 'assets'. Value 'ohmv2' is not supported.",
  },
}
const EXAMPLE_BAD_PARAMETER_UPPERCASE_ERROR_MESSAGE: WsAssetMetricsErrorResponse = {
  error: {
    type: 'bad_parameter',
    message: "Value 'OHMV2' is not supported for parameter 'assets'.",
  },
}
const EXAMPLE_MALFORMED_BAD_PARAMETER_ERROR_MESSAGE: WsAssetMetricsErrorResponse = {
  error: {
    type: 'bad_parameter',
    message: "Bad parameter 'assets'.",
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
  beforeEach(() => {
    invalidBaseAssets.length = 0
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

  it('should compose url with empty assets when all desired subs are invalid', async () => {
    invalid_currencies.push('btc')
    const url = await calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
      {
        base: 'BTC',
        quote: VALID_QUOTES.USD,
      },
    ])
    expect(new URL(url).searchParams.get('assets')).toEqual('')
    expect(new URL(url).searchParams.get('metrics')).toEqual('')
  })
})

describe('price-ws message handler', () => {
  beforeEach(() => {
    invalidBaseAssets.length = 0
  })

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
  it('bad parameter error stores the unsupported asset', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_BAD_PARAMETER_ERROR_MESSAGE)
    expect(res).toEqual([])
    expect(invalidBaseAssets).toContain('ohmv2')
  })
  it('bad parameter error stores the unsupported asset in lowercase', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_BAD_PARAMETER_UPPERCASE_ERROR_MESSAGE)
    expect(res).toEqual([])
    expect(invalidBaseAssets).toContain('ohmv2')
  })
  it('malformed bad parameter error does not throw', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_MALFORMED_BAD_PARAMETER_ERROR_MESSAGE)
    expect(res).toEqual([])
    expect(invalidBaseAssets).toEqual([])
  })
  it('reorg message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_REORG_MESSAGE)
    expect(res).toEqual([])
  })
})
