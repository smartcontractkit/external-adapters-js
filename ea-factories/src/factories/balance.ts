import {
  ExecuteFactory,
  Config,
  ResponseData,
  Account,
  SequenceResponseData,
} from '@chainlink/types'
import objectPath from 'object-path'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'

const DEFAULT_DATA_PATH = 'addresses'
const DEFAULT_CONFIRMATIONS = 6

const WARNING_NO_OPERATION = 'No Operation: unsupported'
const ERROR_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

export type IsSupported = (coin: string, chain: string) => boolean
export type GetBalance = (account: Account, config: BalanceConfig) => Promise<ResponseData>
export type GetBatchBalance = (
  accGroup: [string, AccountGroup],
  config: Config,
) => Promise<ResponseData>

export type BalanceImplConfig = Config & {
  confirmations?: number
  shouldOverwrite?: boolean
  verbose?: boolean
}
export type BalanceConfig = BalanceImplConfig & {
  isSupported: IsSupported
  getBalance?: GetBalance
  getBatchBalance?: GetBatchBalance
}

// TODO: this could be an extension of Validator
const validateInput = (jobRunID: string, validated: RequestData, data: any) => {
  const dataPath = validated.dataPath || DEFAULT_DATA_PATH
  const inputData = <Account[]>objectPath.get(data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw new AdapterError({
      jobRunID,
      message: `Input, at '${dataPath}' path, must be a non-empty array.`,
      statusCode: 400,
    })

  return inputData
}

// TODO: this could be an extension of Validator
const validateEachInput = (jobRunID: string, accounts: Account[], config: BalanceConfig) =>
  accounts.map((acc) => {
    // Is it possible to process?
    if (!acc.address)
      throw new AdapterError({
        jobRunID,
        message: ERROR_NO_OPERATION_MISSING_ADDRESS,
        statusCode: 400,
      })

    // Defaults
    if (!acc.chain) acc.chain = 'mainnet'
    if (!acc.coin) acc.coin = 'btc'

    // Should we process?
    if (!config.shouldOverwrite && typeof acc.balance === 'number') return acc

    // Do we support processing?
    const supported = config.isSupported(acc.coin, acc.chain)
    if (!supported) return { ...acc, warning: WARNING_NO_OPERATION }

    // If warning, clear and continue to processing
    const { warning, ...accNoWarning } = acc
    return accNoWarning
  })

const getBalances = async (
  config: BalanceConfig,
  accounts: Account[],
  getBalance: GetBalance,
): Promise<ResponseData[]> =>
  Promise.all(
    accounts.map((acc) => {
      if (acc.warning) return { result: acc }
      return getBalance(acc, config)
    }),
  )

export type AccountGroup = { addresses: string[]; result: Account[] }
const group = (accounts: Account[]) => {
  const output: { [coin: string]: AccountGroup } = {}
  for (const acc of accounts) {
    const key = `${acc.coin}-${acc.chain}` as string
    output[key] = output[key] || { addresses: [], result: [] }
    if (!acc.warning) output[key].addresses.push(acc.address)
    output[key].result.push(acc)
  }
  return Object.entries(output)
}

export const getBalancesBatch = async (
  config: BalanceConfig,
  accGroupEntries: [string, AccountGroup][],
  getBatchBalance: GetBatchBalance,
): Promise<ResponseData[]> =>
  Promise.all(accGroupEntries.map((accGroupEntry) => getBatchBalance(accGroupEntry, config)))

const reduceToResponse = (config: BalanceConfig, responses: ResponseData[]) =>
  responses.reduce<SequenceResponseData<Account>>(
    (accumulator, current) => {
      if (config.verbose) accumulator.responses = [...accumulator.responses, current]
      accumulator.result = config.getBatchBalance
        ? [...accumulator.result, ...current.result]
        : [...accumulator.result, current.result]
      return accumulator
    },
    { responses: [], result: [] },
  )

const inputParams = {
  dataPath: false,
  confirmations: false,
}

type RequestData = {
  dataPath: string
  confirmations: number
}

export const make: ExecuteFactory<BalanceConfig> = (config) => async (input) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error
  if (!config) throw new Error('No configuration supplied')
  if (!config.getBalance && !config.getBatchBalance)
    throw new Error('Request handling logic not supplied')
  config.confirmations = validator.validated.confirmations || DEFAULT_CONFIRMATIONS
  const jobRunID = validator.validated.id
  let inputData = validateInput(jobRunID, validator.validated.data, input.data)
  inputData = validateEachInput(jobRunID, inputData, config)

  let responses

  if (config.getBatchBalance) {
    const groupedData = group(inputData)
    responses = await getBalancesBatch(config, groupedData, config.getBatchBalance)
  }
  if (config.getBalance) {
    responses = await getBalances(config, inputData, config.getBalance)
  }

  const reducedResponse = reduceToResponse(config, responses as ResponseData[])

  return Requester.success(jobRunID, { data: reducedResponse, status: 200 })
}
