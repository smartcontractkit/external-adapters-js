import {
  AdapterConfigError,
  AdapterDataProviderError,
  AdapterInputError,
  Logger,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Schema, StateQuery } from '@cardano-ogmios/client'
import { ExtendedConfig } from '../config'
import { BigNumber } from 'ethers'
import { createInteractionContext } from './ogmios'

export const supportedEndpoints = ['balance']

export interface ResponseSchema {
  data: {
    balance: number
  }
}

export const description = "This endpoint fetches an address's balance and outputs it in Lovelace."

export type TInputParameters = { addresses: Array<{ address: string }> }

export const inputParameters: InputParameters<TInputParameters> = {
  addresses: {
    aliases: ['result'],
    description: 'An array of addresses to query balances for',
    type: 'array',
    required: true,
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const [wsOgmiosURL, httpOgmiosURL] = getOgmiosHosts(jobRunID, config)
  const result = await getAddressBalances(
    jobRunID,
    addresses.map((address) => address.address),
    wsOgmiosURL,
    httpOgmiosURL,
  )

  const endpointResponse = {
    jobRunID,
    result,
    data: {
      result,
    },
    statusCode: 200,
  }

  return Requester.success(jobRunID, endpointResponse, config.verbose)
}

const getOgmiosHosts = (jobRunID: string, config: ExtendedConfig): string[] => {
  let { wsOgmiosURL, httpOgmiosURL } = config
  if (!wsOgmiosURL || !httpOgmiosURL) {
    const { host, port, isTLSEnabled } = config
    if (!host) {
      throw new AdapterConfigError({
        jobRunID,
        message: "Cannot construct Ogmios URLs as 'host' environment variable not set",
        statusCode: 500,
      })
    }
    const wsProtocol = isTLSEnabled ? 'wss' : 'ws'
    const httpProtocol = isTLSEnabled ? 'https' : 'http'
    wsOgmiosURL = `${wsProtocol}://${host}:${port}`
    httpOgmiosURL = `${httpProtocol}://${host}:${port}`
  }
  return [wsOgmiosURL, httpOgmiosURL]
}

const getAddressBalances = async (
  jobRunID: string,
  addresses: Schema.Address[],
  wsURL: string,
  httpURL: string,
): Promise<string> => {
  const errorHandler = (error: Error) => {
    throw new AdapterDataProviderError({
      jobRunID,
      message: `Cardano Ogmios Error Name: "${error.name}" Message: "${error.message}"`,
      statusCode: 500,
    })
  }

  const closeHandler = (code: number, reason: string) => {
    Logger.info(`Cardano Ogmios WS connection closed.  Code: "${code}" Reason: "${reason}"`)
  }

  const interactionContext = await createInteractionContext(
    errorHandler,
    closeHandler,
    wsURL,
    httpURL,
  )
  const utxo = await StateQuery.utxo(interactionContext, addresses)
  const balanceAsBigNum = utxo.reduce(
    (total, [_, out]) => total.add(BigNumber.from(out.value.coins)),
    BigNumber.from(0),
  )
  return balanceAsBigNum.toString()
}
