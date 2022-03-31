import { Validator, Requester, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/ea-bootstrap'
import { Config } from '../config'

export const supportedEndpoints = ['balance']

export const description =
  'The balance endpoint will fetch the balance of each address in the query.'

export type TInputParameters = { addresses: Address[] }
export const inputParameters: InputParameters<TInputParameters> = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
}

interface AddressWithBalance {
  address: string
  balance: string
}

type Address = {
  address: string
}

interface ResponseWithResult extends Partial<AxiosResponse> {
  result: AddressWithBalance[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses as Address[]

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const balances: AddressWithBalance[] = await Promise.all(
    addresses.map((addr) => getBalance(addr.address, config)),
  )

  const response = {
    jobRunID,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }

  const result: ResponseWithResult = {
    ...response,
    result: balances,
    data: {
      result: balances,
    },
  }

  return Requester.success(jobRunID, result)
}

const getBalance = async (address: string, config: Config): Promise<AddressWithBalance> => ({
  address,
  balance: (await config.provider.getBalance(address)).toString(),
})
