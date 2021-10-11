import { Validator, Requester, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { utils } from 'ethers'

export const supportedEndpoints = ['balance']

export const inputParameters: InputParameters = {
  addresses: ['addresses'],
}

interface AddressWithBalance {
  address: string
  balance: number | BigInteger
}

interface Address {
  address: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses

  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'address' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const balances = await Promise.all<AddressWithBalance>(
    addresses.map((addr: Address) => getBalance(addr.address, config)),
  )
  const formattedBalances = balances.map((balance) => ({
    ...balance,
    balance: utils.formatEther(balance.balance),
  }))
  const result = { jobRunID, statusCode: 200, data: formattedBalances, result: formattedBalances }
  console.log(result)
  return Requester.success(jobRunID, result)
}

const getBalance: any = async (address: string, config: Config) => ({
  address,
  balance: await config.provider.getBalance(address),
})
