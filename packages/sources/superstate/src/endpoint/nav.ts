import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { navTransport } from '../transport/nav'
import {
  AssetsUnderManagement,
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  NetAssetValue,
} from '../transport/utils'
import { validateTime } from './utils'

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
    startTime: {
      description:
        'Start of the daily window (HH:mm:ss) during which the data provider is polled for a fresh value',
      type: 'string',
      default: DEFAULT_START_TIME,
    },
    endTime: {
      description:
        'End of the daily window (HH:mm:ss) during which the data provider is polled for a fresh value',
      type: 'string',
      default: DEFAULT_END_TIME,
    },
  },
  [
    {
      fundId: 1,
      reportValue: NetAssetValue,
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
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
  inputParameters,
  transport: navTransport,
  customInputValidation: (req): AdapterInputError | undefined => {
    const { startTime, endTime } = req.requestContext.data
    validateTime(startTime, endTime)
    return
  },
})
