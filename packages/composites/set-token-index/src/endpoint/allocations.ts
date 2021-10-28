import { ethers } from 'ethers'
import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { makeMiddleware, Requester, Validator, withMiddleware } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import * as TA from '../../../token-allocation'
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
        executeWithMiddleware(options, context).then((value) => resolve(value.data))
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

export const inputParameters: InputParameters = {
  contractAddress: true,
  setAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const contractAddress = validator.validated.data.contractAddress
  const setAddress = validator.validated.data.setAddress

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const index = new ethers.Contract(contractAddress, ABI, provider)

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
}
