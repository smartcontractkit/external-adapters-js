import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../src/config'
import { RequestParams } from '../../src/endpoint/reserves'
import {
  checkAddressLists,
  checkBalanceSources,
  checkComponents,
  checkConversions,
  checkProviderUrls,
  checkSchedule,
} from '../../src/utils/validation'

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
  const validParams = {
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
    schedule: {
      feedDescription: 'My test feed',
      timezone: 'America/New_York',
      daily: [
        {
          start: '03:00',
          end: '11:59',
        },
        {
          start: '12:00',
          end: '02:59', // Wraps around midnight
        },
      ],
    },
    resultDecimals: 18,
  } as const satisfies RequestParams

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-07T12:34:56Z'))
  })

  describe('checkProviderUrls', () => {
    const providerUrls = new Map<string, string>()
    const settings = makeStub('settings', {
      PROVIDER_URL: {
        get(provider: string) {
          const envVarName = provider.toUpperCase().replace(/-/g, '_') + '_URL'
          if (!providerUrls.has(envVarName)) {
            throw new AdapterError({
              statusCode: 500,
              message: `Missing environment variable for provider URL: ${envVarName}`,
            })
          }
          return providerUrls.get(envVarName)!
        },
      },
    } as typeof config.settings)

    beforeEach(() => {
      providerUrls.clear()
    })

    it('should succeed if environment variables are set for all providers', () => {
      providerUrls.set('TEST_ADDRESS_LIST_ADAPTER_URL', 'https://example.com/address')
      providerUrls.set('TEST_BALANCE_ADAPTER_URL', 'https://example.com/balance')
      providerUrls.set('TEST_VIEW_FUNCTION_ADAPTER_URL', 'https://example.com/conversion')
      checkProviderUrls(validParams, settings)
    })

    it('should throw if the environment variable is missing for an addressList provider', () => {
      providerUrls.set('TEST_BALANCE_ADAPTER_URL', 'https://example.com/balance')
      providerUrls.set('TEST_VIEW_FUNCTION_ADAPTER_URL', 'https://example.com/conversion')
      expectAdapterError(() => checkProviderUrls(validParams, settings), {
        statusCode: 500,
        message: 'Missing environment variable for provider URL: TEST_ADDRESS_LIST_ADAPTER_URL',
      })
    })

    it('should throw if the environment variable is missing for a balanceSource provider', () => {
      providerUrls.set('TEST_ADDRESS_LIST_ADAPTER_URL', 'https://example.com/address')
      providerUrls.set('TEST_VIEW_FUNCTION_ADAPTER_URL', 'https://example.com/conversion')
      expectAdapterError(() => checkProviderUrls(validParams, settings), {
        statusCode: 500,
        message: 'Missing environment variable for provider URL: TEST_BALANCE_ADAPTER_URL',
      })
    })

    it('should throw if the environment variable is missing for a conversion provider', () => {
      providerUrls.set('TEST_ADDRESS_LIST_ADAPTER_URL', 'https://example.com/address')
      providerUrls.set('TEST_BALANCE_ADAPTER_URL', 'https://example.com/balance')
      expectAdapterError(() => checkProviderUrls(validParams, settings), {
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

  describe('checkSchedule', () => {
    const newYorkNoon = new Date('2026-05-07T16:00:00Z')

    it('should succeed for a valid schedule', () => {
      expect(() => checkSchedule(validParams)).not.toThrow()
    })

    it('should throw when timezone is invalid', () => {
      const invalidTimezone = 'Invalid/Timezone'

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          timezone: invalidTimezone,
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Invalid schedule timezone: '${invalidTimezone}'`,
      })
    })

    it('should throw when schedule is present but empty', () => {
      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: 'When present, schedule must include at least one daily time range.',
      })
    })

    it('should throw when start time is in wrong format', () => {
      const invalidTime = '00:00:00' // Invalid format with seconds

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [
            {
              start: invalidTime,
              end: '20:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Invalid time format: '${invalidTime}', expected 'HH:mm'`,
      })
    })

    it('should throw when end time is in wrong format', () => {
      const invalidTime = '00:00:00' // Invalid format with seconds

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [
            {
              start: '20:00',
              end: invalidTime,
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Invalid time format: '${invalidTime}', expected 'HH:mm'`,
      })
    })

    it('should throw when start time equals end time', () => {
      const time = '12:34'
      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [
            {
              start: time,
              end: time,
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Invalid daily time range with identical start and end times: '${time}'`,
      })
    })

    it('should throw when ranges are not in order', () => {
      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [
            {
              start: '22:00',
              end: '23:00',
            },
            {
              start: '02:00',
              end: '03:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Daily time ranges must be in chronological order and must not overlap. Start time '02:00' is not after previous end time '23:00'.`,
      })
    })

    it('should throw when ranges overlap', () => {
      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [
            {
              start: '02:00',
              end: '12:00',
            },
            {
              start: '08:00',
              end: '18:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Daily time ranges must be in chronological order and must not overlap. Start time '08:00' is not after previous end time '12:00'.`,
      })
    })

    it('should threat connecting ranges as overlapping', () => {
      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          daily: [
            {
              start: '02:00',
              end: '12:00',
            },
            {
              start: '12:00',
              end: '18:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Daily time ranges must be in chronological order and must not overlap. Start time '12:00' is not after previous end time '12:00'.`,
      })
    })

    it('should throw when current time is outside of schedule', () => {
      jest.setSystemTime(newYorkNoon)

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          timezone: 'America/New_York',
          daily: [
            {
              start: '08:00',
              end: '11:00',
            },
            {
              start: '13:00',
              end: '20:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 409,
        message: `Request for feed 'My test feed' received at time 12:00 outside of schedule: 08:00 to 11:00; 13:00 to 20:00`,
      })
    })

    it('should throw when current time is outside of wrapped schedule', () => {
      jest.setSystemTime(newYorkNoon)

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          timezone: 'America/New_York',
          daily: [
            {
              start: '13:00',
              end: '11:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 409,
        message: `Request for feed 'My test feed' received at time 12:00 outside of schedule: 13:00 to 11:00`,
      })
    })

    it('should throw for overlapping ranges even if current time is within the first range', () => {
      jest.setSystemTime(newYorkNoon)
      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          timezone: 'America/New_York',
          daily: [
            {
              start: '02:00',
              end: '14:00',
            },
            {
              start: '08:00',
              end: '18:00',
            },
          ],
        },
      }

      expectAdapterError(() => checkSchedule(params), {
        statusCode: 400,
        message: `Daily time ranges must be in chronological order and must not overlap. Start time '08:00' is not after previous end time '14:00'.`,
      })
    })

    it('should succeed for current time in first part of wrapped schedule', () => {
      jest.setSystemTime(newYorkNoon)

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          timezone: 'America/New_York',
          daily: [
            {
              start: '11:00',
              end: '01:00',
            },
          ],
        },
      }

      expect(() => checkSchedule(params)).not.toThrow()
    })

    it('should succeed for current time in second part of wrapped schedule', () => {
      jest.setSystemTime(newYorkNoon)

      const params: RequestParams = {
        ...validParams,
        schedule: {
          ...validParams.schedule,
          timezone: 'America/New_York',
          daily: [
            {
              start: '23:00',
              end: '13:00',
            },
          ],
        },
      }

      expect(() => checkSchedule(params)).not.toThrow()
    })
  })
})
