import { NumericResultEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters, ssaTransport } from '../transport/ssa'

export { inputParameters }
export type { BaseEndpointTypes }

export const endpoint = new NumericResultEndpoint({
  name: 'ssa',
  aliases: [],
  transport: ssaTransport,
  inputParameters,
  customInputValidation: (req) => {
    if (req.requestContext.data.security_id.trim().length === 0) {
      return new AdapterInputError({
        statusCode: 400,
        message: 'security_id must be a non-empty string',
      })
    }
    return undefined
  },
  requestTransforms: [
    (req) => {
      req.requestContext.data.security_id = req.requestContext.data.security_id.toUpperCase()
    },
  ],
})
