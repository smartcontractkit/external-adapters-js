import { AdapterError, Logger, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { createInteractionContext, Schema, StateQuery } from '@cardano-ogmios/client'
import { ExtendedConfig, DEFAULT_RPC_PORT } from '../config'
import { BigNumber } from 'ethers'

export const supportedEndpoints = ['balance']

export interface ResponseSchema {
  data: {
    balance: number
  }
}

export const inputParameters: InputParameters = {
  addresses: {
    aliases: ['result'],
    description: 'An array of addresses to query balances for',
    type: 'array',
    required: true,
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const result = await getAddressBalances(
    jobRunID,
    addresses.map((address) => address.address),
    config.api.baseWsUrl,
    config.rpcPort || DEFAULT_RPC_PORT,
    config.isTLSEnabled,
  )

  return {
    jobRunID,
    result,
    data: {
      result,
    },
    statusCode: 200,
  }
}

const getAddressBalances = async (
  jobRunID: string,
  addresses: Schema.Address[],
  wsUrl: string,
  port: number,
  isTLSEnabled: boolean,
): Promise<string> => {
  const errorHandler = (error: Error) => {
    throw new AdapterError({
      jobRunID,
      message: `Cardano Ogmios Error Name: "${error.name}" Message: "${error.message}"`,
      statusCode: 500,
    })
  }

  const closeHandler = (code: number, reason: string) => {
    Logger.info(`Cardano Ogmios WS connection closed.  Code: "${code}" Reason: "${reason}"`)
  }

  const interactionContext = await createInteractionContext(errorHandler, closeHandler, {
    connection: {
      host: wsUrl,
      port,
      tls: isTLSEnabled,
    },
  })
  const utxo = await StateQuery.utxo(interactionContext, addresses)
  const balanceAsBigNum = utxo.reduce(
    (total, [_, out]) => total.add(BigNumber.from(out.value.coins)),
    BigNumber.from(0),
  )
  return balanceAsBigNum.toString()
}
