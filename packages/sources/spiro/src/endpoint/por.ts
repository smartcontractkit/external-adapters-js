import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import type { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { config } from '../config'
import { porTransport } from '../transport/por' // FRAMEWORK-EXCEPTION: SPIRO-4

export const inputParameters = new InputParameters(
  {
    fundId: {
      description: 'Fund id',
      type: 'string', // FRAMEWORK-EXCEPTION: SPIRO-4
      required: true,
    },
    reportValue: {
      description: 'Which value to report on as top-level result',
      type: 'string',
      default: 'totalReserve', // FRAMEWORK-EXCEPTION: SPIRO-4
      options: ['totalReserve'], // FRAMEWORK-EXCEPTION: SPIRO-4
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
      fundId: 'michigan-pilot', // FRAMEWORK-EXCEPTION: SPIRO-4
      reportValue: 'totalReserve', // FRAMEWORK-EXCEPTION: SPIRO-4
      noErrorOnRipcord: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  // FRAMEWORK-EXCEPTION-BEGIN: SPIRO-4
  Response: SingleNumberResultResponse & {
    Data: {
      result: number
      totalReserves: number
      ripcord: boolean
      ripcordAsInt: number
    },
  }
  // FRAMEWORK-EXCEPTION-END: SPIRO-4
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'por', // FRAMEWORK-EXCEPTION: SPIRO-4
  inputParameters,
  transport: porTransport, // FRAMEWORK-EXCEPTION: SPIRO-4
})
