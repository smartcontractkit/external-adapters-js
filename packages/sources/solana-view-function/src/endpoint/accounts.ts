import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig } from '../config'
import * as solanaWeb3 from '@solana/web3.js'

export const supportedEndpoints = ['accounts']

export const inputParameters: InputParameters = {
  addresses: {
    required: true,
    description: 'An array of the addresses to query information from',
    type: 'array',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id

  if (!config.rpcUrl)
    throw new AdapterError({
      jobRunID,
      message: 'Solana RPC URL not set',
    })

  const solanaConnection = new solanaWeb3.Connection(
    config.rpcUrl,
    config.commitment as solanaWeb3.Commitment,
  )

  const accountPublicKeys = validator.validated.data.addresses.map(
    (address: string) => new solanaWeb3.PublicKey(address),
  )
  const accountInformation = await solanaConnection.getMultipleAccountsInfo(accountPublicKeys, {
    encoding: 'jsonParsed',
  })

  const result = accountInformation.length
  return {
    jobRunID,
    data: {
      accountInformation,
      result,
    },
    result,
    statusCode: 200,
  }
}
