import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { extensionTransport } from '../transport/extension'

// See https://solana.com/docs/tokens/extensions and
// https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/enum.ExtensionType.html
// for documentation about Solana token extensions.
//
// As an example, if you want to read the `multiplier` field from the
// `ScaledUiAmount`, find the extension number (25) at
// https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/enum.ExtensionType.html#variant.ScaledUiAmount
// Then find the data layout in the source code at https://github.com/solana-program/token-2022/blob/08692efe0e84c6740780ed8b4da2bbe3efd34307/interface/src/extension/scaled_ui_amount/mod.rs#L46
// And because the `authority` field of type OptionalNonZeroPubkey takes 32
// bytes, the `multiplier` field has offset 32.
// So this field would be read with input:
// {
//   "stateAccountAddress": "<token account address>",
//   "extensionDataOffset": 166,
//   "extensionFields": [
//     {
//       "extensionType": 25,
//       "name": "multiplier",
//       "offset": 32,
//       "type": "float64"
//     }
//   ]
// }

const baseFieldParameterType = {
  name: {
    description: 'Name to give the value in the response data',
    type: 'string',
    required: true,
  },
  offset: {
    description: 'Byte offset of the field in the account data',
    type: 'number',
    required: true,
  },
  type: {
    description: 'Data type of the field',
    type: 'string',
    required: true,
    options: ['float64', 'int64', 'uint64'],
  },
} as const

export const inputParameters = new InputParameters(
  {
    stateAccountAddress: {
      description: 'The state account address for the program',
      type: 'string',
      required: true,
    },
    baseFields: {
      description: 'Fields to get from the base section of the account data',
      type: baseFieldParameterType,
      required: false,
      array: true,
    },
    extensionDataOffset: {
      description: 'Byte offset where the extensions section starts in the account data',
      type: 'number',
      default: 166, // Default offset for Token-2022 accounts
    },
    extensionFields: {
      description: 'Fields to get from the token extension section of the account data',
      type: {
        extensionType: {
          description: 'The number identifying the extension type',
          type: 'number',
          required: true,
        },
        ...baseFieldParameterType,
      },
      required: false,
      array: true,
    },
  },
  [
    {
      stateAccountAddress: '2HehXG149TXuVptQhbiWAWDjbbuCsXSAtLTB5wc2aajK',
      baseFields: [
        {
          name: 'supply',
          offset: 36,
          type: 'uint64',
        },
      ],
      extensionDataOffset: 166,
      extensionFields: [
        // ScaledUiAmount is type 25 and has the following layout:
        // pub struct ScaledUiAmountConfig {
        //   pub authority: OptionalNonZeroPubkey,           // 32 bytes
        //   pub multiplier: PodF64,                         // 8 bytes
        //   pub new_multiplier_effective_timestamp: PodI64, // 8 bytes
        //   pub new_multiplier: PodF64,                     // 8 bytes
        // }
        {
          extensionType: 25, // ScaledUiAmount
          name: 'currentMultiplier',
          offset: 32,
          type: 'float64',
        },
        {
          extensionType: 25, // ScaledUiAmount
          name: 'newMultiplier',
          offset: 48,
          type: 'float64',
        },
        {
          extensionType: 25, // ScaledUiAmount
          name: 'activationDateTime',
          offset: 40,
          type: 'int64',
        },
      ],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      [fieldName: string]: number | string
    }
    Result: null
  }
  Settings: typeof config.settings
}

export type RequestParams = typeof inputParameters.validated

export const endpoint = new AdapterEndpoint({
  name: 'extension',
  aliases: [],
  transport: extensionTransport,
  inputParameters,
})
