import { ethers } from 'ethers'
import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { makeMiddleware, Requester, Validator, withMiddleware, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import * as TA from '@chainlink/token-allocation-adapter'
import { makeExecute } from '../adapter'

export const supportedEndpoints = ['allocations']

export function getToken(
  context: AdapterContext,
  id: string,
  address: string,
): Promise<TA.types.TokenAllocation[]> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'tokens',
      address,
      maxAge: 60 * 60 * 1000, // 1 hour
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context)
          // TODO: makeExecute return types
          .then((value) => resolve(value.data as any))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}

/*
  NOTICE!

  The current implementation is fetching data directly from SetToken contracts (https://etherscan.io/address/0x78733fa5e70e3ab61dc49d93921b289e4b667093#code)
  Note that this implementation won't work in other networks unless we deploy a copy of the contract.

  The correct implementation should use SetProtocol.js typed library instead to fetch data directly from the SetToken contract directly.
  The ChainlinkAdapter.getAllocations(ISetToken _setToken) should be reimplemented in JS in order to use it.
*/

const ABI = [
  {
    inputs: [{ internalType: 'contract ISetToken', name: '_setToken', type: 'address' }],
    name: 'getAllocations',
    outputs: [
      { internalType: 'address[]', name: '', type: 'address[]' },
      { internalType: 'int256[]', name: '', type: 'int256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export type TInputParameters = {
  contractAddress: string
  setAddress: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  contractAddress: {
    required: true,
  },
  setAddress: {
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const contractAddress = validator.validated.data.contractAddress
  const setAddress = validator.validated.data.setAddress

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const index = new ethers.Contract(contractAddress, ABI, provider)

  try {
    const [addresses, balances] = await index.getAllocations(setAddress)

    // Token balances are coming already normalized as 18 decimals token
    const allocations = await Promise.all(
      addresses.map(async (address: string, i: number) => {
        const token = await getToken(context, jobRunID, address)
        return {
          balance: balances[i].toString(),
          ...token,
        }
      }),
    )
    const response = {
      data: allocations,
    }

    return Requester.success(jobRunID, response, true)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: config.network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
