import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { customSubscriptionTransport } from '../transport/reserves'

export const inputParameters = new InputParameters(
  {
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
        addresses: {
          description:
            'Describes how addresses to be queried are determined. Can be absent if the addresses are hard coded in the balance provider params or if the balance provider already knows which addresses to query.',
          required: false,
          type: {
            provider: {
              description:
                'Identifier of the service to query for addresses. This corresponse to the prefix of the environment variable {provider}_URL.',
              type: 'string',
              required: true,
            },
            params: {
              description:
                'JSON string encoding the parameters to be passed to the provider when querying for addresses.',
              type: 'string',
              required: true,
            },
          },
        },
        balances: {
          description: 'Describes how the balances of the addresses are determined.',
          required: true,
          type: {
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
          },
        },
        reduce: {
          description:
            'Describes how to get the total balance of the component from the result of the balances provider.',
          required: true,
          type: {
            arrayPath: {
              description:
                'The object path to find the array of balances in the result from the balances provider',
              type: 'string',
              required: true,
            },
            balancePath: {
              description: 'The object path to find the balance in an array item',
              type: 'string',
              required: true,
            },
            decimalsPath: {
              description:
                'The object path to find the number of decimals to scale the fixed point balance in an array item.',
              type: 'string',
              required: true,
            },
          },
        },
      },
    },
    conversions: {
      description:
        'Describes how to convert the balances of the components to the same currency if they are not already reported in the same currency. Conversions are applied in order and each conversion is applied to every applicable component.',
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
        operation: {
          type: 'string',
          required: true,
          description:
            'Whether to multiple or divide the result from the provider to perform the conversion.',
          options: ['multiply', 'divide'],
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

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  aliases: [],
  transport: customSubscriptionTransport,
  inputParameters,
  overrides: overrides['proof-of-reserves-2'],
})
