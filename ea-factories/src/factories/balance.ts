import {
  ExecuteFactory,
  Config,
  DataResponse,
  Account,
  SequenceResponseData,
} from '@chainlink/types'
import objectPath from 'object-path'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'

const DEFAULT_DATA_PATH = 'addresses'
const DEFAULT_CONFIRMATIONS = 6

const WARNING_UNSUPPORTED_PARAMS = 'No Operation: this provider does not support'
const ERROR_MISSING_ADDRESS = 'No Operation: address param is missing'

function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

export function addresses(accounts: Account[]) {
  return accounts.reduce<string[]>((accumulator, current) => {
    if (!current.warning) accumulator.push(current.address)
    return accumulator
  }, [])
}

export type IsSupported = (coin: string, chain: string) => boolean
export type BalanceResponse = DataResponse<Account, any>
export type GetBalance = (account: Account, config: BalanceConfig) => Promise<BalanceResponse>
export type BalancesResponse = DataResponse<Account[], any>
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

const toValidAccount = (jobRunID: string, account: Account, config: BalanceConfig) => {
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

const getBalances = async (
  config: BalanceConfig,
  accounts: Account[],
  getBalance: GetBalance,
): Promise<BalanceResponse[]> =>
  Promise.all(
    accounts.map((acc) => {
      if (acc.warning) return { result: acc }
      return getBalance(acc, config)
    }),
  )

const reduceBalances = (config: BalanceConfig, responses: BalanceResponse[]) =>
  responses.reduce<SequenceResponseData<Account>>(
    (accumulator, current) => {
      if (config.verbose) accumulator.responses = [...accumulator.responses, current]
      accumulator.result = [...accumulator.result, current.result]
      return accumulator
    },
    { responses: [], result: [] },
  )

export const getBalancesBatch = async (
  config: BalanceConfig,
  accGroups: Account[][],
  getBalances: GetBalances,
): Promise<BalancesResponse[]> =>
  Promise.all(accGroups.map((accounts) => getBalances(accounts, config)))

const reduceBalancesBatch = (config: BalanceConfig, responses: BalancesResponse[]) =>
  responses.reduce<SequenceResponseData<Account>>(
    (accumulator, current) => {
      if (config.verbose) accumulator.responses = [...accumulator.responses, current]
      accumulator.result = [...accumulator.result, ...current.result]
      return accumulator
    },
    { responses: [], result: [] },
  )

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
  const data = validator.validated.data
  const dataPath = validator.validated.dataPath || DEFAULT_DATA_PATH
  const accounts = requireArray(jobRunID, data, dataPath).map((acc) =>
    toValidAccount(jobRunID, acc, config),
  )

  let response

  if (config.getBalances) {
    const grouped = groupBy(accounts, (acc) => `${acc.coin}-${acc.chain}`)
    const responses = await getBalancesBatch(
      config,
      Array.from(grouped.values()),
      config.getBalances,
    )
    response = reduceBalancesBatch(config, responses)
  }
  if (config.getBalance) {
    const responses = await getBalances(config, accounts, config.getBalance)
    response = reduceBalances(config, responses)
  }

  return Requester.success(jobRunID, { data: response, status: 200 })
}
