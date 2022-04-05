import { ExecuteWithConfig, ExecuteFactory, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExtendedConfig, makeConfig } from './config'
import { PorInputAddress } from '@chainlink/proof-of-reserves-adapter/src/utils/PorInputAddress'
import Decimal from 'decimal.js'

const inputParameters: InputParameters = {
  addresses: true,
  minConfirmations: false,
}

const getPorId = (network: string, chainId: string) => `${network}_${chainId}`.toUpperCase()

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.jobRunID
  const minConfirmations = validator.validated.data.minConfirmations as number
  const porInputAddresses = validator.validated.data.addresses as PorInputAddress[]

  // Collect addresses into their respective PoR requests
  // Mapping from PoR ID to list of addresses
  const porServiceRequests = new Map<string, string[]>()
  for (const { network, chainId, address } of porInputAddresses) {
    if (typeof network === 'undefined' || typeof chainId === 'undefined') {
      throw new Error(`network and chainId must be defined for address ${address}`)
    }
    const id = getPorId(network, chainId)
    const existingAddresses = porServiceRequests.get(id) || []
    porServiceRequests.set(id, [...existingAddresses, address])
  }

  // Fire off requests to each PoR indexer
  const responsePromises = []
  for (const [porId, addresses] of porServiceRequests.entries()) {
    const indexerEndpointEnvName = `${porId}_POR_INDEXER_URL` as keyof typeof config
    const indexerUrl = config[indexerEndpointEnvName]
    if (typeof indexerUrl !== 'string') {
      throw new Error(`No PoR Indexer endpoint configured for ${indexerEndpointEnvName}`)
    }

    const response = Requester.request({
      ...config.api,
      method: 'post',
      url: indexerUrl,
      data: {
        id: jobRunID,
        data: {
          addresses,
          minConfirmations,
        },
      },
    })
    responsePromises.push(response)
  }

  // Sum up the total reserves from each PoR indexer
  const responses = await Promise.all(responsePromises)
  const summedTotalReserves = responses
    .map((response) => {
      const totalReserves = new Decimal(response.data.data.totalReserves)
      if (!totalReserves.isFinite() || totalReserves.isNaN()) {
        throw new Error(`Invalid totalReserves answer: ${totalReserves.toString()}`)
      }
      return totalReserves
    })
    .reduce((p, c) => p.add(c), new Decimal(0))

  return Requester.success(jobRunID, {
    data: {
      result: summedTotalReserves.toString(),
    },
  })
}

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
