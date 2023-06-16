import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import * as queryString from 'querystring'
import { config } from '../../src/config'
import {
  calculateAssetMetricsUrl,
  handleAssetMetricsMessage,
  WsAssetMetricsErrorResponse,
  WsAssetMetricsSuccessResponse,
  WsAssetMetricsWarningResponse,
} from '../../src/transport/price-ws'
import { assetMetricsInputParameters, BaseEndpointTypes } from '../../src/endpoint/price-router'

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
