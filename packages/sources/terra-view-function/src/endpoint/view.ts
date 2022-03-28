import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { LCDClient } from '@terra-money/terra.js'
import { Config, ChainId, SUPPORTED_CHAIN_IDS } from '../config'

export const supportedEndpoints = ['view']

export const inputParameters: InputParameters = {
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
  resultPath: {
    required: false,
    description:
      'The object-path string to parse a single `result` value. When not provided the entire response will be provided.',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, { chainId: SUPPORTED_CHAIN_IDS })

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const query = validator.validated.data.query
  const params = validator.validated.data.params
  const chainID = (validator.validated.data.chainId || config.defaultChainId) as ChainId
  const resultPath = validator.validated.data.resultPath as string

  const URL = config.lcdUrls[chainID]
  if (!URL)
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      message: `RPC URL for ${chainID} is not configured as an environment variable.`,
    })

  const terra = new LCDClient({
    URL,
    chainID,
  })

  const response = await terra.wasm.contractQuery<Record<string, unknown>>(address, query, params)
  const result = resultPath ? Requester.validateResultNumber(response, [resultPath]) : response

  const output = {
    data: { result },
    result,
  }

  return Requester.success(jobRunID, output, config.verbose)
}
