import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { sharePriceTransport } from '../transport/share-price'

export const inputParameters = new InputParameters(
  {
    vault_object_id: {
      description: 'The Aptos object ID of the Decibel vault to query',
      type: 'string',
      required: true,
    },
    output_decimals: {
      description: 'Number of decimals to scale the output share price (default 18)',
      type: 'number',
      required: false,
      default: 18,
    },
  },
  [
    {
      vault_object_id: '0x06ad70a9a4f30349b489791e2f2bcf58363dad30e54a9d2d4095d6213d7a9bf9',
      output_decimals: 18,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      share_price: string
      vault_nav: string
      vault_total_shares: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'share-price',
  transport: sharePriceTransport,
  inputParameters,
})
