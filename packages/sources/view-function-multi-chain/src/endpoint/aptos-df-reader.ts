import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { HttpTransportTypes, transport } from '../transport/aptos-df-reader'
import { aptosBaseInputParameters, doAptosCustomInputValidation } from '../utils/aptos-common'

export const inputParameters = new InputParameters({
  ...aptosBaseInputParameters,
  feedId: {
    description: 'feedId to parse',
    type: 'string',
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint<HttpTransportTypes>({
  name: 'aptos-df-reader',
  transport: transport,
  inputParameters,
  customInputValidation: (req) => doAptosCustomInputValidation(req.requestContext.data.networkType),
})
