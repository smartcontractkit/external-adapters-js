import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { porTransport } from '../transport/proof-of-reserves'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(
  {
    network: {
      type: 'string',
      description: 'The name of RPC network.',
      required: true,
    },
    dlcContract: {
      type: 'string',
      description: 'Contract address to fetch vaults.',
      required: true,
    },
  },
  [
    {
      network: 'arbitrum',
      dlcContract: '0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2',
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
  inputParameters,
  transport: porTransport,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
  ): AdapterInputError | undefined => {
    const { network } = req.requestContext.data
    const networkName = network.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName] as string
    const chainId = Number(process.env[chainIdEnvName])
    if (!rpcUrl || !chainId || isNaN(chainId)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${networkEnvName}' or '${chainIdEnvName}' environment variables.`,
      })
    }
    return
  },
})
