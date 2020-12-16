import {
  ExecuteFactory,
  Config,
  DataResponse,
  Account,
  SequenceResponseData,
} from '@chainlink/types'
import objectPath from 'object-path'
import { Validator, AdapterError } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const DEFAULT_DATA_PATH = 'addresses'
const DEFAULT_CONFIRMATIONS = 6

const WARNING_UNSUPPORTED_PARAMS = 'No Operation: this provider does not support'
const ERROR_MISSING_ADDRESS = 'No Operation: address param is missing'

export function addresses(accounts: Account[]) {
  return accounts.reduce<string[]>((accumulator, current) => {
    if (!current.warning) accumulator.push(current.address)
    return accumulator
  }, [])
}

export type IsSupported = (coin: string, chain: string) => boolean
export type BalancesResponse = DataResponse<Account[], any>
export type GetBalance = (account: Account, config: BalanceConfig) => Promise<BalancesResponse>
export type GetBalances = (accounts: Account[], config: BalanceConfig) => Promise<BalancesResponse>

export type BalanceConfig = Config & {
  confirmations?: number
  shouldOverwrite?: boolean
  verbose?: boolean
  isSupported: IsSupported
  getBalance?: GetBalance
  getBalances?: GetBalances
}

const requireArray = (jobRunID: string, dataPath: string, data: any) => {
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

const toValidAccount = (jobRunID: string, account: Account, config: BalanceConfig): Account => {
  // Is it possible to process?
  if (!account.address)
    throw new AdapterError({
      jobRunID,
      message: ERROR_MISSING_ADDRESS,
      statusCode: 400,
    })

  // Defaults
  if (!account.chain) account.chain = 'mainnet'
  if (!account.coin) account.coin = 'btc'

  // Should we process?
  if (!config.shouldOverwrite && typeof account.balance === 'number') return account

  // Do we support processing?
  const supported = config.isSupported(account.coin, account.chain)
  if (!supported)
    return { ...account, warning: WARNING_UNSUPPORTED_PARAMS + ` ${account.chain} ${account.coin}` }

  // If warning, clear and continue to processing
  const { warning, ...accNoWarning } = account
  return accNoWarning
}

const toGetBalances = (getBalance?: GetBalance) => (accounts: Account[], config: BalanceConfig) => {
  if (!getBalance) throw new Error('Get Balance function not supplied')
  return accounts.map(async (acc) => {
    if (acc.warning) return { result: [acc] }
    return getBalance(acc, config)
  })
}

const inputParams = {
  dataPath: false,
  confirmations: false,
}

export const make: ExecuteFactory<BalanceConfig> = (config) => async (input) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error
  if (!config) throw new Error('No configuration supplied')
  if (!config.getBalance && !config.getBalances)
    throw new Error('Request handling logic not supplied')
  config.confirmations = validator.validated.confirmations || DEFAULT_CONFIRMATIONS
  const jobRunID = validator.validated.id
  const dataPath = validator.validated.data.dataPath || DEFAULT_DATA_PATH
  const accounts = requireArray(jobRunID, dataPath, input.data).map((acc) =>
    toValidAccount(jobRunID, acc, config),
  )

  const getBalances = config.getBalances || toGetBalances(config.getBalance)

  const key = (acc: Account) => `${acc.coin}-${acc.chain}`
  const groups = Array.from(util.groupBy<string, Account>(accounts, key).values())
  const requests = groups.flatMap((group) => getBalances(group, config))
  const responses = await Promise.all(requests)

  const data: SequenceResponseData<Account> = {
    responses: responses.map((r: any) => r.payload),
    result: responses.flatMap((r: any) => r.result),
  }

  if (!config.verbose) delete data.responses

  return { jobRunID, statusCode: 200, data, result: data.result }
}
