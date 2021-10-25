// import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, Execute, AdapterContext } from '@chainlink/types'
import * as PoR from '@chainlink/proof-of-reserves-adapter'
import * as wrapped from '@chainlink/wrapped-adapter'
import { makeConfig } from './config'

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
): Promise<AdapterResponse> => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.protocol || 'ETH'
  const protocol = validator.validated.protocol || 'list'
  const indexer = validator.validated.indexer || 'eth_balance'

  const _executeWrapped = wrapped.makeExecute()
  const addresses = await _executeWrapped(
    {
      id: jobRunID,
      data: {
        symbol: symbol,
      },
    },
    context,
  )

  if (addresses.statusCode !== 200) {
    return addresses
  }

  const _executePoR = PoR.makeExecute()
  const sum = await _executePoR(
    {
      id: jobRunID,
      data: {
        protocol: protocol,
        indexer: indexer,
        addresses: addresses.result,
      },
    },
    context,
  )
  return Requester.success(jobRunID, sum)
}

export const makeExecute = (): Execute => {
  return async (request, context) => execute(request, context || makeConfig())
}
