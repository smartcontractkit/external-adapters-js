import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { packagesTransport } from '../transport/packages'

export const inputParameters = new InputParameters(
  {
    packageId: {
      required: true,
      type: 'string',
      description: 'Id of the collateral management package',
    },
    assetType: {
      required: true,
      type: 'string',
      description: 'Asset ticker name',
    },
  },
  [
    {
      packageId: '1c1dd6b2899660900088',
      assetType: 'BTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      assets: {
        asset: {
          assetType: string
        }
        quantity: string
      }[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'packages',
  transport: packagesTransport,
  inputParameters,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.COLLATERAL_API_KEY) {
      throw new AdapterInputError({
        message: 'Missing COLLATERAL_API_KEY',
        statusCode: 400,
      })
    }
    return
  },
})
