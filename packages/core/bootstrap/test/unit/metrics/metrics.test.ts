import { AdapterRequest, AdapterResponse, Execute } from '../../../src/types'
import * as metrics from '../../../src/lib/metrics'
import * as client from 'prom-client'

// This is a workaround to mock METRICS_ENABLED, which is usually defined before jest is able to mock it's value
jest.mock('../../../src/lib/util', () => ({
  ...(jest.requireActual('../../../src/lib/util') as any),
  parseBool: () => true,
}))

describe('Bootstrap/Metrics', () => {
  describe('setupMetrics', () => {
    it(`Gets the correct feed id with valid input`, () => {
      const spy = jest.spyOn(client.register, 'setDefaultLabels')
      metrics.setupMetrics('test')
      expect(spy).toBeCalledWith({ app_name: 'test', app_version: process.env.npm_package_version })
    })
  })
})

describe('withMetrics middleware', () => {
  afterEach(() => jest.clearAllMocks())

  it(`Records metrics successfully (with data provider hit)`, async () => {
    const spy = jest.spyOn(client.Counter.prototype, 'labels')
    const mockResponse = {
      data: { result: 1, statusCode: 200 },
      jobRunID: '1',
      result: 1,
      statusCode: 200,
    }
    const execute: Execute = async () => mockResponse
    const middleware = await metrics.withMetrics()
    const wrappedExecute = await middleware(execute, {})

    const request: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'testDownstreamEndpoint',
        source: 'SOMESOURCEADAPTER',
      },
    }

    const expectedOutput = {
      ...mockResponse,
      meta: {
        adapterName: undefined,
      },
      metricsMeta: {
        feedId: '{"data":{"endpoint":"testDownstreamEndpoint","source":"SOMESOURCEADAPTER"}}',
      },
    }

    const expectedLabels = {
      feed_id: '{"data":{"endpoint":"testDownstreamEndpoint","source":"SOMESOURCEADAPTER"}}',
      is_cache_warming: 'false',
      method: 'POST',
      provider_status_code: 200,
      status_code: 200,
      type: 'dataProviderHit',
    }

    const res = await wrappedExecute(request, {})
    expect(res).toEqual(expectedOutput)
    expect(spy).toBeCalledWith(expectedLabels)
  })

  it(`Records metrics successfully (with cache hit)`, async () => {
    const spy = jest.spyOn(client.Counter.prototype, 'labels')
    const mockResponse = {
      data: { result: 1, maxAge: 123, statusCode: 200 },
      jobRunID: '1',
      result: 1,
      statusCode: 200,
    }

    const execute: Execute = async () => mockResponse
    const middleware = await metrics.withMetrics()
    const wrappedExecute = await middleware(execute, {})

    const request: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'testDownstreamEndpoint',
        source: 'SOMESOURCEADAPTER',
      },
    }

    const expectedOutput = {
      ...mockResponse,
      meta: {
        adapterName: undefined,
      },
      metricsMeta: {
        feedId: '{"data":{"endpoint":"testDownstreamEndpoint","source":"SOMESOURCEADAPTER"}}',
      },
    }

    const expectedLabels = {
      feed_id: '{"data":{"endpoint":"testDownstreamEndpoint","source":"SOMESOURCEADAPTER"}}',
      is_cache_warming: 'false',
      method: 'POST',
      provider_status_code: 200,
      status_code: 200,
      type: 'cacheHit',
    }

    const res = await wrappedExecute(request, {})
    expect(res).toEqual(expectedOutput)
    expect(spy).toBeCalledWith(expectedLabels)
  })

  it(`Records error metrics (with adapter error)`, async () => {
    const spy = jest.spyOn(client.Counter.prototype, 'labels')
    const mockResponse = { jobRunID: '1', result: 1, statusCode: 500 }

    const execute: Execute = async () => mockResponse as AdapterResponse
    const middleware = await metrics.withMetrics()
    const wrappedExecute = await middleware(execute, {})

    const request: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'testDownstreamEndpoint',
        source: 'SOMESOURCEADAPTER',
      },
    }

    const expectedLabels = {
      feed_id: '{"data":{"endpoint":"testDownstreamEndpoint","source":"SOMESOURCEADAPTER"}}',
      is_cache_warming: 'false',
      method: 'POST',
      provider_status_code: undefined,
      status_code: 500,
      type: 'adapterError',
    }

    try {
      await wrappedExecute(request, {})
    } catch (error) {
      expect(error.message).toEqual("Cannot read properties of undefined (reading 'maxAge')")
      expect(spy).toBeCalledWith(expectedLabels)
    }
  })
})

describe('recordDataProviderAttempt', () => {
  afterEach(() => jest.clearAllMocks())

  it(`Records metrics successfully (GET, 200)`, async () => {
    const spy = jest.spyOn(client.Counter.prototype, 'labels')
    const expectedLabels = {
      method: 'GET',
      provider_status_code: 200,
    }

    const record = metrics.recordDataProviderRequest()
    record(expectedLabels.method, expectedLabels.provider_status_code)
    expect(spy).toBeCalledWith(expectedLabels)
  })

  it(`Records metrics successfully (POST, 400)`, async () => {
    const spy = jest.spyOn(client.Counter.prototype, 'labels')
    const expectedLabels = {
      method: 'POST',
      provider_status_code: 400,
    }

    const record = metrics.recordDataProviderRequest()
    record(expectedLabels.method, expectedLabels.provider_status_code)
    expect(spy).toBeCalledWith(expectedLabels)
  })
})
