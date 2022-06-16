import { Requester, Validator, AdapterInputError, Value, AdapterDataProviderError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { LCDClient } from '@terra-money/terra.js'
import { APIParams } from '@terra-money/terra.js/dist/client/lcd/APIRequester'
import { Config, ChainId, SUPPORTED_CHAIN_IDS } from '../config'

export const supportedEndpoints = ['view']

export type TInputParameters = {
  address: string
  query:
    | string
    | Record<string, Value>
    | Record<string, Record<string, Value>>
    | Record<string, unknown>
  params?: Record<string, Value>
  chainId?: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  address: {
    aliases: ['contract'],
    required: true,
    description: 'The address to query',
    type: 'string',
  },
  query: {
    required: true,
    description: 'The query object',
  },
  params: {
    required: false,
    description: 'Optional params object to include in the query',
  },
  chainId: {
    required: false,
    description:
      'Which chain ID to connect to. Default is `DEFAULT_CHAIN_ID` environment variable (`columbus-5`, `bombay-12`, `localterra`, etc.)',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {
    chainId: SUPPORTED_CHAIN_IDS,
  })

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const query = validator.validated.data.query || {}
  const params = validator.validated.data.params as APIParams
  const chainID = (validator.validated.data.chainId || config.defaultChainId) as ChainId
  const resultPath = validator.validated.data.resultPath as string

  const URL = config.lcdUrls[chainID]
  if (!URL)
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `RPC URL for ${chainID} is not configured as an environment variable.`,
    })

  try {
    const terra = new LCDClient({
      URL,
      chainID,
    })

  // NOTE: the types for terra.js don't show string queries, we need to coerce
  const response = await terra.wasm.contractQuery<Record<string, unknown>>(
    address,
    query as Record<string, unknown>,
    params,
  )
  const result = resultPath ? Requester.validateResultNumber(response, [resultPath]) : response

    const output = {
      data: { result },
      result,
    }

    return Requester.success(jobRunID, output, config.verbose)
  } catch (e) {
    throw new AdapterDataProviderError({ network: 'terra', cause: e })
  }
}
