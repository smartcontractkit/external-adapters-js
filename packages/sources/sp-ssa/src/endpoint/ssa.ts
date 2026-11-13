import { NumericResultEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters, ssaTransport } from '../transport/ssa'

export { inputParameters }
export type { BaseEndpointTypes }

export const endpoint = new NumericResultEndpoint({
  name: 'ssa',
  aliases: [],
  transport: ssaTransport,
  inputParameters,
  requestTransforms: [
    (req) => {
      req.requestContext.data.security_id = req.requestContext.data.security_id.toUpperCase()
    },
  ],
})
