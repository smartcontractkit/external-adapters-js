import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Address, Utxo } from '@cardano-ogmios/schema'
import * as client from '@cardano-ogmios/client'
import { DEFAULT_RPC_PORT } from '../config'
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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
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
    addresses.map((address) => address.address),
    config.api.baseWsUrl,
    config.rpcPort || DEFAULT_RPC_PORT,
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
  addresses: Address[],
  wsUrl: string,
  port: number,
): Promise<string> => {
  const utxo = await client.utxo(addresses, {
    connection: {
      port,
      host: wsUrl,
      protocol: 'ws',
    },
  })

  // TODO:  Figure out error that shows up whenever we try to pull in Ogmios V4.1.0
  // The issue here is that we are using the V3.2.0 client, which has a different response type than
  // what is being returned from the API.  The API returns v4.1.0.  This code works ut casting utxo is ugly.
  const balanceAsBigNum = (utxo as unknown as Utxo).reduce(
    (total, [_, out]) => total.add(BigNumber.from(out.value.coins)),
    BigNumber.from(0),
  )
  return balanceAsBigNum.toString()
}
