import { Validator, Requester, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/types'
import { Config } from '../config'
import { BigNumber, utils } from 'ethers'

export const supportedEndpoints = ['balance']

export const inputParameters: InputParameters = {
  addresses: ['addresses', 'result'],
}

interface AddressWithBalance {
  address: string
  balance: string | BigNumber
}

interface Address {
  address: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses || validator.validated.data.result

  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const balances = await Promise.all<AddressWithBalance>(
    addresses.map((addr: Address) => getBalance(addr.address, config)),
  )
  const formattedBalances: AddressWithBalance[] = balances.map((balance) => ({
    ...balance,
    balance: utils.formatEther(balance.balance),
  }))

  const response = {
    jobRunID,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: formattedBalances,
  }

  return Requester.success(
    jobRunID,
    Requester.withResult(response, formattedBalances as AxiosResponse<AddressWithBalance[]>),
  )
}

const getBalance: (address: string, config: Config) => Promise<AddressWithBalance> = async (
  address: string,
  config: Config,
) => ({
  address,
  balance: await config.provider.getBalance(address),
})
