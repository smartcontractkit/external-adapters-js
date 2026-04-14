import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { customSubscriptionTransport } from '../transport/reserves'
import {
  checkAddressLists,
  checkBalanceSources,
  checkComponents,
  checkConversions,
  checkProviderUrls,
} from '../utils/validation'

export const inputParameters = new InputParameters(
  {
    addressLists: {
      description: 'Address lists available for compoments to reference by name.',
      array: true,
      type: {
        name: {
          description: 'The name of the address list.',
          type: 'string',
          required: true,
        },
        provider: {
          description:
            'Identifier of the service to query for addresses. This corresponse to the prefix of the environment variable {provider}_URL.',
          type: 'string',
          required: false,
        },
        params: {
          description:
            'JSON string encoding the parameters to be passed to the provider when querying for addresses.',
          type: 'string',
          required: false,
        },
        addressArrayPath: {
          description:
            'The object path to find the array of addresses in the result from the provider.',
          type: 'string',
          required: false,
        },
        fixed: {
          description:
            'A fixed JSON-encoded array of address objects in the format expected by the balance source.',
          type: 'string',
          required: false,
        },
      },
    },
    balanceSources: {
      description: 'Describe how to fetch balances given an a provided address list.',
      array: true,
      type: {
        name: {
          description: 'Used by components to reference this balance source.',
          type: 'string',
          required: true,
        },
        provider: {
          description:
            'Identifier of the service to query for balances. This corresponse to the prefix of the environment variable {provider}_URL.',
          type: 'string',
          required: true,
        },
        params: {
          description:
            'JSON string encoding the parameters to be passed to the provider when querying for balances.',
          type: 'string',
          required: true,
        },
        addressArrayPath: {
          description:
            'The object path to place the array of addresses in the request to the balances provider.',
          type: 'string',
          required: false,
        },
        balancesArrayPath: {
          description:
            'The object path to find the array of balances in the result from the balances provider. If absent, it means a single balance is returned and pointed to by the balancePath.',
          type: 'string',
          required: false,
        },
        balancePath: {
          description:
            'The object path to find the balance in an array item or directly in the balance provider response',
          type: 'string',
          required: true,
        },
        decimalsPath: {
          description:
            'The object path to find the number of decimals to scale the fixed point balance in an array item (or directly in the balance provider response). If absent, the balance is considered to be an unscaled floating point number.',
          type: 'string',
          required: false,
        },
      },
    },
    components: {
      description:
        'Individual components of the total reserves. To be converted to the same currency and then added together.',
      array: true,
      required: true,
      type: {
        name: {
          description: 'The name or description of the component.',
          type: 'string',
          required: true,
        },
        currency: {
          description:
            'The symbol of the currency in which the balance of the component is reported. This is only used to determine if the balance needs to be converted',
          type: 'string',
          required: true,
        },
        addressList: {
          description: 'The name of the address list to use for this component.',
          required: false,
          type: 'string',
        },
        balanceSource: {
          description: 'Name of the balance source to use to fetch balances.',
          required: true,
          type: 'string',
        },
        conversions: {
          description:
            'List of conversions to apply. Each conversion is formatted as "A/B" where "A" and "B" refer to the from/to of a conversion defined in the conversions input parameter.',
          array: true,
          type: 'string',
        },
      },
    },
    conversions: {
      description:
        'Describes how to convert the balances of the components to the same currency if they are not already reported in the same currency. If a component requires an inverse conversion, this is derived automatically.',
      array: true,
      required: false,
      type: {
        from: {
          description: 'The symbol of the currency to convert from.',
          type: 'string',
          required: true,
        },
        to: {
          description: 'The symbol of the currency to convert to.',
          type: 'string',
          required: true,
        },
        provider: {
          type: 'string',
          required: true,
          description:
            'Identifier of the service to query for conversion rates. This corresponse to the prefix of the environment variable {provider}_URL.',
        },
        params: {
          description:
            'JSON string encoding the parameters to be passed to the provider when querying for conversion rates.',
          type: 'string',
          required: true,
        },
        ratePath: {
          type: 'string',
          required: true,
          description:
            'The object path to find the conversion rate in the result from the provider.',
        },
        decimalsPath: {
          description:
            'The object path to find the number of decimals to scale the fixed point conversion rate in the result from the provider. If absent, the result is considered to be an unscaled floating point number',
          type: 'string',
          required: false,
        },
      },
    },
    resultDecimals: {
      description: 'Number of decimals to use for the fixed point result.',
      type: 'number',
      required: true,
    },
  },
  [],
)

export type RequestParams = typeof inputParameters.validated

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      resultAsNumber: number
      decimals: number
      components: {
        name: string
        currency: string
        totalBalance: number
        originalCurrency?: string
        totalBalanceInOriginalCurrency?: {
          amount: string
          decimals: number
        }
        addressCount?: number
      }[]
      conversionRates: {
        from: string
        to: string
        rate: number
      }[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  aliases: [],
  transport: customSubscriptionTransport,
  inputParameters,
  customInputValidation: (request, _settings): undefined => {
    const params = request.requestContext.data
    checkProviderUrls(params)
    checkAddressLists(params)
    checkBalanceSources(params)
    checkConversions(params)
    checkComponents(params)
    return
  },
})
