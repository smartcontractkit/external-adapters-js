import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { RequestParams } from '../../src/endpoint/reserves'
import {
  checkAddressLists,
  checkBalanceSources,
  checkComponents,
  checkConversions,
  checkProviderUrls,
  getProviderUrl,
} from '../../src/utils/validation'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

const expectAdapterError = (
  call: () => void,
  { statusCode, message }: { statusCode: number; message: string },
) => {
  expect.assertions(1)
  try {
    call()
  } catch (error: unknown) {
    if (!(error instanceof AdapterError)) {
      throw expect(String(error)).toBe('AdapterError')
    }
    expect(error.toJSONResponse()).toEqual({
      error: {
        name: 'AdapterError',
        message,
      },
      status: 'errored',
      statusCode,
    })
  }
}

describe('validation', () => {
  const validParams: RequestParams = {
    addressLists: [
      {
        name: 'test-address-list',
        provider: 'test-address-list-adapter',
        params: '{}',
        addressArrayPath: 'addresses',
      },
    ],
    balanceSources: [
      {
        name: 'test-balance-source',
        provider: 'test-balance-adapter',
        params: '{}',
        addressArrayPath: 'addresses',
        balancePath: 'balance',
      },
    ],
    components: [
      {
        name: 'test-component',
        currency: 'BTC',
        addressList: 'test-address-list',
        balanceSource: 'test-balance-source',
        conversions: ['BTC/USD'],
      },
    ],
    conversions: [
      {
        from: 'BTC',
        to: 'USD',
        provider: 'test-view-function-adapter',
        params: '{}',
        ratePath: 'result',
      },
    ],
    resultDecimals: 18,
  }

  beforeEach(async () => {
    restoreEnv()
  })

  describe('getProviderUrl', () => {
    it('should return the provider URL from environment variable', () => {
      const expectedUrl = 'https://example.com/api'
      process.env['TEST_ADAPTER_URL'] = expectedUrl
      expect(getProviderUrl('test-adapter')).toBe(expectedUrl)
    })

    it('should throw if the environment variable is missing', () => {
      expectAdapterError(() => getProviderUrl('test-adapter'), {
        statusCode: 500,
        message: 'Missing environment variable for provider URL: TEST_ADAPTER_URL',
      })
    })
  })

  describe('checkProviderUrls', () => {
    it('should succeed if environment variables are set for all providers', () => {
      process.env.TEST_ADDRESS_LIST_ADAPTER_URL = 'https://example.com/address'
      process.env.TEST_BALANCE_ADAPTER_URL = 'https://example.com/balance'
      process.env.TEST_VIEW_FUNCTION_ADAPTER_URL = 'https://example.com/conversion'
      checkProviderUrls(validParams)
    })

    it('should throw if the environment variable is missing for an addressList provider', () => {
      process.env.TEST_BALANCE_ADAPTER_URL = 'https://example.com/balance'
      process.env.TEST_VIEW_FUNCTION_ADAPTER_URL = 'https://example.com/conversion'
      expectAdapterError(() => checkProviderUrls(validParams), {
        statusCode: 500,
        message: 'Missing environment variable for provider URL: TEST_ADDRESS_LIST_ADAPTER_URL',
      })
    })

    it('should throw if the environment variable is missing for a balanceSource provider', () => {
      process.env.TEST_ADDRESS_LIST_ADAPTER_URL = 'https://example.com/address'
      process.env.TEST_VIEW_FUNCTION_ADAPTER_URL = 'https://example.com/conversion'
      expectAdapterError(() => checkProviderUrls(validParams), {
        statusCode: 500,
        message: 'Missing environment variable for provider URL: TEST_BALANCE_ADAPTER_URL',
      })
    })

    it('should throw if the environment variable is missing for a conversion provider', () => {
      process.env.TEST_ADDRESS_LIST_ADAPTER_URL = 'https://example.com/address'
      process.env.TEST_BALANCE_ADAPTER_URL = 'https://example.com/balance'
      expectAdapterError(() => checkProviderUrls(validParams), {
        statusCode: 500,
        message: 'Missing environment variable for provider URL: TEST_VIEW_FUNCTION_ADAPTER_URL',
      })
    })
  })

  describe('checkAddressLists', () => {
    it('should succeed for a valid params', () => {
      expect(() => checkAddressLists(validParams)).not.toThrow()
    })

    it('should throw for duplicate address list name', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          {
            name: 'duplicate-name',
            fixed: '[]',
          },
          {
            name: 'duplicate-name',
            fixed: '[]',
          },
        ],
      }

      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message: "Duplicate address list name: 'duplicate-name'",
      })
    })

    it('should throw for unused address list name', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          ...validParams.addressLists,
          {
            name: 'unused-address-list',
            fixed: '[]',
          },
        ],
      }

      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message: "Unused address list: 'unused-address-list'",
      })
    })

    it('should throw if an address list has a fixed value that is not JSON', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          {
            name: 'fixed-not-json',
            fixed: 'not-json',
          },
        ],
      }

      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message:
          "Address list 'fixed-not-json' has invalid fixed value: Unexpected token 'o', \"not-json\" is not valid JSON",
      })
    })

    it('should throw if an address list has a fixed value that is not an array', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          {
            name: 'fixed-not-array',
            fixed: '{"not":"an array"}',
          },
        ],
      }

      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message: "Address list 'fixed-not-array' has invalid fixed value: value is not an array",
      })
    })

    it('should throw if an address list has neither a fixed value nor a provider', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          {
            name: 'not-fixed-no-provider',
            params: '{}',
            addressArrayPath: 'addresses',
          },
        ],
      }
      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message:
          "Address list 'not-fixed-no-provider' must have 'provider', 'params' and 'addressArrayPath' params when 'fixed' param is not provided",
      })
    })

    it('should throw if an address list has both a fixed value and a provider', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          {
            name: 'fixed-and-provider',
            fixed: '["0x123"]',
            provider: 'test-adapter',
          },
        ],
      }
      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message:
          "Address list 'fixed-and-provider' cannot have 'provider', 'params' or 'addressArrayPath' params when 'fixed' param is provided",
      })
    })

    it('should throw if an address list has params that are not JSON', () => {
      const params: RequestParams = {
        ...validParams,
        addressLists: [
          {
            name: 'params-not-json',
            provider: 'test-adapter',
            params: 'not-json',
            addressArrayPath: 'addresses',
          },
        ],
      }
      expectAdapterError(() => checkAddressLists(params), {
        statusCode: 400,
        message:
          "Address list 'params-not-json' has invalid 'params' value: Unexpected token 'o', \"not-json\" is not valid JSON",
      })
    })
  })

  describe('checkBalanceSources', () => {
    it('should succeed for a valid params', () => {
      expect(() => checkBalanceSources(validParams)).not.toThrow()
    })

    it('should throw for duplicate balance source name', () => {
      const params: RequestParams = {
        ...validParams,
        balanceSources: [
          ...validParams.balanceSources,
          {
            name: 'duplicate-name',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
          {
            name: 'duplicate-name',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
      }

      expectAdapterError(() => checkBalanceSources(params), {
        statusCode: 400,
        message: "Duplicate balance source name: 'duplicate-name'",
      })
    })

    it('should throw for unused balance source', () => {
      const params: RequestParams = {
        ...validParams,
        balanceSources: [
          ...validParams.balanceSources,
          {
            name: 'unused-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
      }

      expectAdapterError(() => checkBalanceSources(params), {
        statusCode: 400,
        message: "Unused balance source: 'unused-balance-source'",
      })
    })

    it('should throw if a balance source has params that are not JSON', () => {
      const params: RequestParams = {
        ...validParams,
        balanceSources: [
          {
            name: 'params-not-json',
            provider: 'test-adapter',
            params: 'not-json',
            balancePath: 'balance',
          },
        ],
      }
      expectAdapterError(() => checkBalanceSources(params), {
        statusCode: 400,
        message:
          "Balance source 'params-not-json' has invalid 'params' value: Unexpected token 'o', \"not-json\" is not valid JSON",
      })
    })
  })

  describe('checkConversions', () => {
    it('should succeed for a valid params', () => {
      expect(() => checkConversions(validParams)).not.toThrow()
    })

    it('should throw for duplicate conversion', () => {
      const params: RequestParams = {
        ...validParams,
        conversions: [
          ...validParams.conversions,
          {
            from: 'FOO',
            to: 'BAR',
            provider: 'test-adapter',
            params: '{}',
            ratePath: 'result',
          },
          {
            from: 'BAR',
            to: 'FOO',
            provider: 'test-adapter',
            params: '{}',
            ratePath: 'result',
          },
        ],
      }

      expectAdapterError(() => checkConversions(params), {
        statusCode: 400,
        message: "Duplicate conversion: 'BAR/FOO'",
      })
    })

    it('should throw for unused conversion', () => {
      const params: RequestParams = {
        ...validParams,
        conversions: [
          ...validParams.conversions,
          {
            from: 'UNUSED',
            to: 'CONVERSION',
            provider: 'test-adapter',
            params: '{}',
            ratePath: 'result',
          },
        ],
      }

      expectAdapterError(() => checkConversions(params), {
        statusCode: 400,
        message: "Unused conversion: 'CONVERSION/UNUSED'",
      })
    })

    it('should throw if a conversion has params that are not JSON', () => {
      const params: RequestParams = {
        ...validParams,
        conversions: [
          {
            from: 'BTC',
            to: 'USD',
            provider: 'test-adapter',
            params: 'not-json',
            ratePath: 'result',
          },
        ],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkConversions(params), {
        statusCode: 400,
        message:
          "Conversion 'BTC/USD' has invalid 'params' value: Unexpected token 'o', \"not-json\" is not valid JSON",
      })
    })
  })

  describe('checkComponents', () => {
    it('should succeed for a valid params', () => {
      expect(() => checkComponents(validParams)).not.toThrow()
    })

    it('should throw if a component references an unknown address list', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            addressList: 'unknown-address-list',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          "Component 'test-component' references unknown 'addressList': 'unknown-address-list'",
      })
    })

    it('should throw if a component references an unknown balance source', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'unknown-balance-source',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          "Component 'test-component' references unknown 'balanceSource': 'unknown-balance-source'",
      })
    })

    it('should throw if a component with a balance source with addressArrayPath has no addressList', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
            addressArrayPath: 'addresses',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          "Component 'test-component' has a 'balanceSource' 'test-balance-source' with an 'addressArrayPath' defined, so the component must have an 'addressList'.",
      })
    })

    it('should throw if a component with a balance source without addressArrayPath has an addressList', () => {
      const params: RequestParams = {
        addressLists: [
          {
            name: 'test-address-list',
            provider: 'test-adapter',
            params: '{}',
            addressArrayPath: 'addresses',
          },
        ],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            addressList: 'test-address-list',
            balanceSource: 'test-balance-source',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          "Component 'test-component' uses an address list so its 'balanceSource' 'test-balance-source' must have an 'addressArrayPath' defined.",
      })
    })

    it('should throw if a component references a conversion in the wrong format', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            conversions: ['wrong-format'],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          "Component 'test-component' has invalid conversion format 'wrong-format', expected 'FROM/TO'",
      })
    })

    it('should throw if a component references an unknown conversion', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'BTC',
            balanceSource: 'test-balance-source',
            conversions: ['BTC/USD'],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message: "Component 'test-component' references unknown conversion: 'BTC/USD'",
      })
    })

    it('should throw if a component conversion does not match its currency', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            conversions: ['BTC/USD'],
          },
        ],
        conversions: [
          {
            from: 'BTC',
            to: 'USD',
            provider: 'test-adapter',
            params: '{}',
            ratePath: 'result',
          },
        ],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          "In component 'test-component', conversion 'BTC/USD' cannot be applied to currency 'USD'.",
      })
    })

    it('should throw if components have different currencies without conversion', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            conversions: [],
          },
          {
            name: 'test-component-2',
            currency: 'BTC',
            balanceSource: 'test-balance-source',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          'Components cannot be added together as they are not converted to the same final currency. Final currencies: {"test-component":"USD","test-component-2":"BTC"}',
      })
    })

    it('should throw if components have different currencies after conversion', () => {
      const params: RequestParams = {
        addressLists: [],
        balanceSources: [
          {
            name: 'test-balance-source',
            provider: 'test-adapter',
            params: '{}',
            balancePath: 'balance',
          },
        ],
        components: [
          {
            name: 'test-component',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            conversions: [],
          },
          {
            name: 'test-component-2',
            currency: 'USD',
            balanceSource: 'test-balance-source',
            conversions: ['USD/BTC'],
          },
        ],
        conversions: [
          {
            from: 'USD',
            to: 'BTC',
            provider: 'test-adapter',
            params: '{}',
            ratePath: 'result',
          },
        ],
        resultDecimals: 18,
      }
      expectAdapterError(() => checkComponents(params), {
        statusCode: 400,
        message:
          'Components cannot be added together as they are not converted to the same final currency. Final currencies: {"test-component":"USD","test-component-2":"BTC"}',
      })
    })
  })
})
