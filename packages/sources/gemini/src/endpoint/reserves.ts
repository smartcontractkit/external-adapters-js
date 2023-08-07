import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['reserves']

export interface ResponseSchema {
  addresses: string[]
  ethereum_supply: number
  currency: string
}

export type TInputParameters = { token: string; chainId: string; network: string }
export const inputParameters: InputParameters<TInputParameters> = {
  token: {
    required: false,
    aliases: ['asset', 'coin'],
    description: 'The symbol of the token to query',
    default: 'EFIL',
    type: 'string',
  },
  chainId: {
    required: false,
    description: 'An identifier for which network of the blockchain to use',
    type: 'string',
    default: 'mainnet',
  },
  network: {
    required: false,
    type: 'string',
    default: 'filecoin',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const token = validator.validated.data.token
  const network = validator.validated.data.network || 'filecoin'
  const chainId = validator.validated.data.chainId || 'mainnet'
  const url = util.buildUrlPath('/v1/tokens/:token/reserves', { token: token.toLowerCase() })

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = response.data.addresses.map((address) => ({ address, network, chainId }))

  const output = { ...response, data: { ...response.data, result } }

  return Requester.success(jobRunID, output, config.verbose)
}
