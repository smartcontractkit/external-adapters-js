import { DEFAULT_LWBA_ALIASES, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

export class GSRPriceAdapter<
  CustomSettingsDefinition extends SettingsDefinitionMap,
> extends PriceAdapter<CustomSettingsDefinition> {
  // List of endpoints to apply validation to. Add any others we need to perform custom validation on here
  endpointsToValidate = [...DEFAULT_LWBA_ALIASES]

  // Custom implementation of validateOutput to execute only for LWBA endpoints
  // This is because we need to use the same transport and cache keys for both price and LWBA endpoints due to the way GSR's API works
  override validateOutput(
    req: AdapterRequest<EmptyInputParameters>,
    output: Readonly<AdapterResponse>,
  ): AdapterError | undefined {
    const endpointObj = this.endpointsMap[req.requestContext.endpointName]
    const { endpoint = '' } = req.body.data
    const shouldValidateOutput = this.endpointsToValidate.includes(endpoint.toLowerCase())

    if (endpointObj.customOutputValidation && shouldValidateOutput) {
      return endpointObj.customOutputValidation(output)
    }
    return undefined
  }
}
