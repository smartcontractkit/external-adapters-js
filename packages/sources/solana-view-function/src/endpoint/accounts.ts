import { AdapterConfigError, Requester, AdapterDataProviderError, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ExtendedConfig } from '../config'
import * as solanaWeb3 from '@solana/web3.js'

export const supportedEndpoints = ['accounts']

export type TInputParameters = { addresses: string[] }
export const inputParameters: InputParameters<TInputParameters> = {
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
    throw new AdapterConfigError({
      jobRunID,
      message: 'Solana RPC URL not set',
    })

  try {
    const solanaConnection = new solanaWeb3.Connection(
      config.rpcUrl,
      config.commitment as solanaWeb3.Commitment,
    )

  const accountPublicKeys = validator.validated.data.addresses.map(
    (address: string) => new solanaWeb3.PublicKey(address),
  )
  const accountInformation = await solanaConnection.getMultipleAccountsInfo(accountPublicKeys, {
    encoding: 'jsonParsed',
  } as any)
    // TODO: type doesn't fit dependency)

    const result = accountInformation.length
    const res =  {
      jobRunID,
      data: {
        accountInformation,
        result,
      },
      result,
      statusCode: 200,
    }
    return Requester.success(jobRunID, res, true)
  } catch (e) {
    throw new AdapterDataProviderError({ network: 'solana', cause: e })
  }
}
