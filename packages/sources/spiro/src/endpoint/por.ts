import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import type { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { config } from '../config'
import { porTransport } from '../transport/por'

export const inputParameters = new InputParameters(
  {
    fundId: {
      description: 'Fund id',
      type: 'string',
      required: true,
    },
    reportValue: {
      description: 'Which value to report on as top-level result',
      type: 'string',
      default: 'totalReserve',
      options: ['totalReserve'],
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
      reportValue: 'totalReserve',
      noErrorOnRipcord: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      result: number
      totalReserves: number
      ripcord: boolean
      ripcordAsInt: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'por',
  inputParameters,
  transport: porTransport,
})
