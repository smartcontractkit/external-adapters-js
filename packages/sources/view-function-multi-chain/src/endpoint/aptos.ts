import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { aptosTransport } from '../transport/aptos'
import { aptosBaseInputParameters, doAptosCustomInputValidation } from '../utils/aptos-common'

export const inputParameters = new InputParameters(aptosBaseInputParameters)

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

export const endpoint = new AdapterEndpoint({
  name: 'aptos',
  transport: aptosTransport,
  inputParameters,
  customInputValidation: (req) => doAptosCustomInputValidation(req.requestContext.data.networkType),
})
