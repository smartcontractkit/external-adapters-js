import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { httpTransport } from '../transport/getgrambalances'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    custodianID: {
      type: 'string',
      default: 'Cache',
      description: 'The identifier of the custodian',
    },
    metalCode: {
      type: 'string',
      default: 'AU',
      description: 'The symbol of the metal',
    },
    utilizationLockCode: {
      type: 'string',
      default: 'Locked',
      description: 'The status of the utilization',
    },
  },
  [{ custodianID: 'Cache', metalCode: 'AU', utilizationLockCode: 'Locked' }],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'getgrambalances',
  transport: httpTransport,
  inputParameters,
})
