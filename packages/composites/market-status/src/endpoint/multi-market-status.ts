import {
  AdapterEndpoint,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { transport } from '../transport/multi-market-status'
import { BaseMarketStatusEndpointTypes } from './common'

const modeOptions = ['any', 'all']

export const inputParameters = new InputParameters({
  ...marketStatusEndpointInputParametersDefinition,
  openMode: {
    description:
      'If `any`, returns OPEN if any market is open. If `all`, only returns OPEN if all markets are open.',
    options: modeOptions,
    default: 'any',
    type: 'string',
  },
  closedMode: {
    description:
      'If `any`, returns CLOSED if any market is closed. If `all`, only returns CLOSED if all markets are closed. Processed after `openMode`.',
    options: modeOptions,
    default: 'all',
    type: 'string',
  },
})

export type MultiMarketStatusEndpointTypes = BaseMarketStatusEndpointTypes & {
  Parameters: typeof inputParameters.definition
}

export const endpoint = new AdapterEndpoint({
  name: 'multi-market-status',
  transport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    if (req.requestContext.data.type !== 'regular') {
      throw new AdapterInputError({
        statusCode: 400,
        errorResponse: '[Param: type] must be regular for multi-market-status endpoint',
      })
    }
    return
  },
})
