import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
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
      description: 'Which value to report on as top-level result',
      type: 'string',
      default: NetAssetValue,
      options: [NetAssetValue],
    },
  },
  [
    {
      fundId: 1,
      reportValue: NetAssetValue,
    },
  ],
)

export type NavResultResponse = {
  Result: number
  Data: {
    navPerShare: number
    navDate: string
    currency: string
    aum: string
    fundId: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: NavResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  aliases: ['nav'],
  transport: httpTransport,
  inputParameters,
})
