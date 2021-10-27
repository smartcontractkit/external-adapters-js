import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Address, Lovelace, Utxo } from '@cardano-ogmios/schema'
import * as client from '@cardano-ogmios/client'

export const supportedEndpoints = ['balance']

export interface ResponseSchema {
  data: {
    balance: number
  }
}

export const inputParameters: InputParameters = {
  addresses: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses
  const result = await getAddressBalances(addresses, config.api.baseWsUrl)

  return {
    jobRunID,
    result,
    data: {
      result,
    },
    statusCode: 200,
  }
}

const getAddressBalances = async (addresses: Address[], wsUrl: string): Promise<Lovelace> => {
  const utxo = await client.utxo(addresses, {
    connection: {
      port: 1337,
      host: wsUrl,
      protocol: 'ws',
    },
  })
  // TODO:  Figure out error that shows up whenever we try to pull in Ogmios V4.1.0
  // The issue here is that we are using the V3.2.0 client, which has a different response type than
  // what is being returned from the API.  The API returns v4.1.0
  return (utxo as unknown as Utxo).reduce((total, [_, out]) => total + out.value.coins, 0)
}
