import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import type { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { config } from '../config'
import { navTransport } from '../transport/nav'

export const NetAssetValue = 'net_asset_value'
export const AssetsUnderManagement = 'assets_under_management'

export const inputParameters = new InputParameters(
  {
    fundId: {
      description: 'Fund id',
      type: 'string',
      required: true,
    },
    reportValue: {
      description: 'Which value to report on',
      type: 'string',
      default: NetAssetValue,
      options: [NetAssetValue, AssetsUnderManagement],
    },
    noErrorOnRipcord: {
      type: 'boolean',
      required: false,
      description:
        'Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset',
    },
  },
  [
    {
      fundId: 'michigan-pilot',
      reportValue: NetAssetValue,
      noErrorOnRipcord: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      result: number
      nav: number
      aum: number
      navDate: string
      navDateTimestampMs: number
      ripcord: boolean
      ripcordAsInt: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  inputParameters,
  transport: navTransport,
})
