import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/nav'

export const NetAssetValue = 'net_asset_value'
export const AssetsUnderManagement = 'assets_under_management'

export const inputParameters = new InputParameters(
  {
    fundId: {
      description: 'Fund id',
      type: 'number',
      required: true,
    },
    reportValue: {
      description: 'Which value to report on',
      type: 'string',
      default: NetAssetValue,
      options: [NetAssetValue, AssetsUnderManagement],
    },
  },
  [
    {
      fundId: 1,
      reportValue: NetAssetValue,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  aliases: ['por', 'nav'],
  transport: httpTransport,
  inputParameters,
})
