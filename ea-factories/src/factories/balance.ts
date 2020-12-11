import { ExecuteFactory, Execute, Config, Address, Account } from '@chainlink/types'
import objectPath from 'object-path'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'

const DEFAULT_DATA_PATH = 'addresses'

type ResponseWithResult = {
  response: any
  result: Account
}

export type BalanceConfig = Config & {
  isSupported?: (coin: string, chain: string) => boolean
  isValid?: (acc: Account) => boolean
  getBalance: (address: Address, config: Config) => Promise<ResponseWithResult>
}

export const makeBalance: ExecuteFactory<BalanceConfig> = (config) => {
  type RequestData = {
    dataPath: string
    confirmations: number
  }

  const WARNING_NO_OPERATION_COIN = 'No Operation: unsupported coin'
  const WARNING_NO_OPERATION_TESTNET = "No Operation: 'testnet' is only supported on 'eth'"
  const WARNING_NO_OPERATION_CHAIN =
    "No Operation: invalid chain parameter, must be one of 'mainnet' or 'testnet'"
  const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

  const getBalances = async (config: Config, addresses: Address[], getBalance: any): Promise<any> =>
    Promise.all(
      addresses.map((address) => {
        if (address.warning) return address
        getBalance(address, config)
      }),
    )

  const reduceResponse = (responses: ResponseWithResult[]) =>
    responses.reduce(
      (accumulator, current) => {
        accumulator.data.responses = [...accumulator.data.responses, current.response]
        accumulator.data.result = [...accumulator.data.result, current.result]
        return accumulator
      },
      {
        data: { responses: [], result: [] },
        status: 200,
      } as any,
    )

  const inputParams = {
    dataPath: false,
    confirmations: false,
  }

  // Export function to integrate with Chainlink node
  const execute: Execute = async (input) => {
    const validator = new Validator(input, inputParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id

    const data: RequestData = validator.validated.data
    const dataPath = data.dataPath || DEFAULT_DATA_PATH
    const inputData = <Address[]>objectPath.get(input.data, dataPath)

    // Check if input data is valid
    if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
      throw new AdapterError({
        jobRunID,
        message: `Input, at '${dataPath}' path, must be a non-empty array.`,
        statusCode: 400,
      })

    if (!config) throw new Error('No config')
    const responses = await getBalances(config, inputData, config.getBalance)
    return Requester.success(jobRunID, reduceResponse(responses))
  }

  return execute
}
