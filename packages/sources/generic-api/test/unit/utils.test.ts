import { BaseEndpointTypes } from '../../src/endpoint/multi-http'
import { createResponses } from '../../src/transport/utils'

describe('utils', () => {
  describe('createResponses', () => {
    const apiName = 'TEST'

    it('should extract multiple data paths from response', async () => {
      const params = {
        apiName,
        dataPaths: [
          { name: 'nav', path: 'net_asset_value' },
          { name: 'aum', path: 'asset_under_management' },
        ],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.0043732667449965,
          asset_under_management: 30127047.47,
          ripcord: false,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          nav: 1.0043732667449965,
          aum: 30127047.47,
          ripcord: false,
          ripcordAsInt: 0,
        },
        result: null,
        timestamps: {
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should convert providerIndicatedTimePath ISO string to providerIndicatedTimeUnixMs', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
        providerIndicatedTimePath: 'updatedAt',
      }

      const response = {
        data: {
          net_asset_value: 1.0043732667449965,
          updatedAt: '2026-01-19T06:56:22.194Z',
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          nav: 1.0043732667449965,
        },
        result: null,
        timestamps: {
          providerIndicatedTimeUnixMs: 1768805782194,
        },
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should convert providerIndicatedTimePath Unix ms number to providerIndicatedTimeUnixMs', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
        providerIndicatedTimePath: 'updatedAt',
      }

      const response = {
        data: {
          net_asset_value: 1.0043732667449965,
          updatedAt: 1768805782194,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          nav: 1.0043732667449965,
        },
        result: null,
        timestamps: {
          providerIndicatedTimeUnixMs: 1768805782194,
        },
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should return an error if providerIndicatedTimePath is not found', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
        providerIndicatedTimePath: 'non_existent_timestamp',
      }

      const response = {
        data: {
          net_asset_value: 1.0,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage:
          "Provider indicated time path 'non_existent_timestamp' not found in response for 'TEST'",
        statusCode: 500,
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should return an error if providerIndicatedTimePath value is invalid', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
        providerIndicatedTimePath: 'updatedAt',
      }

      const response = {
        data: {
          net_asset_value: 1.0,
          updatedAt: 'garbage',
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage: "Invalid timestamp value at 'updatedAt' for 'TEST'",
        statusCode: 500,
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should return an error if data path is not found', async () => {
      const params = {
        apiName,
        dataPaths: [
          { name: 'nav', path: 'net_asset_value' },
          { name: 'missing', path: 'non_existent_field' },
        ],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.0,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage: "Data path 'non_existent_field' not found in response for 'TEST'",
        statusCode: 500,
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should return an error if ripcord is activated', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.0,
          ripcord: true,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage: "Ripcord activated for 'TEST'",
        ripcord: true,
        ripcordAsInt: 1,
        ripcordDetails: undefined,
        statusCode: 503,
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should return an error if response data is empty', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: undefined,
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage: "The data provider for TEST didn't return any value",
        statusCode: 502,
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should handle nested data paths', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'value', path: 'data.nested.value' }],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          data: {
            nested: {
              value: 42,
            },
          },
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: { value: 42 },
        result: null,
        timestamps: { providerIndicatedTimeUnixMs: undefined },
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should extract result field as primary result (view-function-multi-chain pattern)', async () => {
      const params = {
        apiName,
        dataPaths: [
          { name: 'result', path: 'net_asset_value' },
          { name: 'aum', path: 'asset_under_management' },
        ],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.004373,
          asset_under_management: 30127047.47,
          ripcord: false,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          result: 1.004373,
          aum: 30127047.47,
          ripcord: false,
          ripcordAsInt: 0,
        },
        result: 1.004373,
        timestamps: { providerIndicatedTimeUnixMs: undefined },
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should include ripcordDetails in error message when ripcord is activated (the-network-firm pattern)', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'result', path: 'net_asset_value' }],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.0,
          ripcord: true,
          ripcordDetails: ['Price deviation too high', 'Stale data detected'],
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage:
          "Ripcord activated for 'TEST'. Details: Price deviation too high, Stale data detected",
        ripcord: true,
        ripcordAsInt: 1,
        ripcordDetails: 'Price deviation too high, Stale data detected',
        statusCode: 503,
      }
      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should handle empty ripcordDetails array', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'result', path: 'net_asset_value' }],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.0,
          ripcord: true,
          ripcordDetails: [],
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        errorMessage: "Ripcord activated for 'TEST'",
        ripcord: true,
        ripcordAsInt: 1,
        ripcordDetails: undefined,
        statusCode: 503,
      }
      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should include ripcord status in data when ripcord is false', async () => {
      const params = {
        apiName,
        dataPaths: [{ name: 'result', path: 'net_asset_value' }],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.004373,
          ripcord: false,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          result: 1.004373,
          ripcord: false,
          ripcordAsInt: 0,
        },
        result: 1.004373,
        timestamps: { providerIndicatedTimeUnixMs: undefined },
      }
      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should return null result when result field not in dataPaths (backward compatible)', async () => {
      const params = {
        apiName,
        dataPaths: [
          { name: 'nav', path: 'net_asset_value' },
          { name: 'aum', path: 'asset_under_management' },
        ],
        ripcordPath: undefined,
        ripcordDisabledValue: 'false',
      }

      const response = {
        data: {
          net_asset_value: 1.004373,
          asset_under_management: 30127047.47,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          nav: 1.004373,
          aum: 30127047.47,
        },
        result: null,
        timestamps: { providerIndicatedTimeUnixMs: undefined },
      }
      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should handle full OpenDelta NX8 scenario', async () => {
      const params = {
        apiName,
        dataPaths: [
          { name: 'result', path: 'net_asset_value' },
          { name: 'nav', path: 'net_asset_value' },
          { name: 'aum', path: 'asset_under_management' },
        ],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
        providerIndicatedTimePath: 'updatedAt',
      }

      const response = {
        data: {
          client: 'opendeltanx8',
          net_asset_value: 1.004373266744996434,
          asset_under_management: 30127047.47,
          outstanding_shares: 29995867.54,
          min_rate: 0.99,
          max_rate: 1.01,
          updatedAt: '2026-01-19T06:56:22.194Z',
          ripcord: false,
          ripcordDetails: [],
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      const expectedResponse = {
        data: {
          result: 1.004373266744996434,
          nav: 1.004373266744996434,
          aum: 30127047.47,
          ripcord: false,
          ripcordAsInt: 0,
        },
        result: 1.004373266744996434,
        timestamps: {
          providerIndicatedTimeUnixMs: 1768805782194,
        },
      }
      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })

    it('should map params', async () => {
      const params = ['path1', 'path2']

      const mapParam = (path: string) => ({
        apiName,
        dataPaths: [{ name: 'result', path }],
        ripcordPath: 'ripcord',
        ripcordDisabledValue: 'false',
      })

      const response = {
        data: {
          path1: 'one',
          path2: 'two',
          ripcord: false,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params,
        apiResponse: response,
        mapParam,
        mapResponse: (multiHttpResponse) => multiHttpResponse,
      })

      expect(adapterResponses).toEqual([
        {
          params: 'path1',
          response: {
            data: {
              result: 'one',
              ripcord: false,
              ripcordAsInt: 0,
            },
            result: 'one',
            timestamps: {
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
        {
          params: 'path2',
          response: {
            data: {
              result: 'two',
              ripcord: false,
              ripcordAsInt: 0,
            },
            result: 'two',
            timestamps: {
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    })

    it('should map response', async () => {
      const nav = 1.0043732667449965

      const params = {
        apiName,
        dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      }

      const response = {
        data: {
          net_asset_value: nav,
        },
      }

      const adapterResponses = createResponses<BaseEndpointTypes>({
        params: [params],
        apiResponse: response,
        mapParam: (param) => param,
        mapResponse: (multiHttpResponse) => ({
          ...multiHttpResponse,
          data: {
            mappedNav: multiHttpResponse.data.nav,
            ...multiHttpResponse.data,
          },
        }),
      })

      const expectedResponse = {
        data: {
          nav,
          mappedNav: nav,
        },
        result: null,
        timestamps: {
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(adapterResponses).toEqual([
        {
          params,
          response: expectedResponse,
        },
      ])
    })
  })
})
