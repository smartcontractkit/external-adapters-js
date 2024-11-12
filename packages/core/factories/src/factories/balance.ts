import {
  AdapterData,
  AdapterInputError,
  AdapterConfigError,
  util,
  Validator,
} from '@chainlink/ea-bootstrap'
import {
  Account,
  Config,
  DataResponse,
  ExecuteFactory,
  SequenceResponseData,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import objectPath from 'object-path'

const DEFAULT_DATA_PATH = 'result'
const DEFAULT_CONFIRMATIONS = 6

const WARNING_UNSUPPORTED_PARAMS = 'No Operation: this provider does not support'
const ERROR_MISSING_ADDRESS = 'No Operation: address param is missing'

export type IsSupported = (coin: string, chain: string) => boolean
export type BalancesResponse = DataResponse<Account[], any>
export type GetBalance = (account: Account, config: BalanceConfig) => Promise<BalancesResponse>
export type GetBalances = (accounts: Account[], config: BalanceConfig) => Promise<BalancesResponse>

type BaseBalanceConfig = Config & {
  confirmations?: number
  isSupported: IsSupported
  getBalance?: GetBalance
  getBalances?: GetBalances
}

type SingleBalanceConfig = BaseBalanceConfig & {
  getBalance: GetBalance
  getBalances?: never
}

type BatchBalanceConfig = BaseBalanceConfig & {
  getBalance?: never
  getBalances: GetBalances
}

// Splits types & re-unions to achieve "only one of either getBalance or getBalances" type
export type BalanceConfig = SingleBalanceConfig | BatchBalanceConfig

const requireArray = (jobRunID: string, dataPath: string, data: any) => {
  const inputData = <Account[]>objectPath.get(data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at '${dataPath}' path, must be a non-empty array.`,
      statusCode: 400,
    })

  return inputData
}

const toValidAccount = (jobRunID: string, account: Account, config: BalanceConfig): Account => {
  // Is it possible to process?
  if (!account.address)
    throw new AdapterInputError({
      jobRunID,
      message: ERROR_MISSING_ADDRESS,
      statusCode: 400,
    })

  // Defaults
  if (!account.chain) account.chain = 'mainnet'
  if (!account.coin) account.coin = 'btc'

  // Do we support processing?
  const supported = config.isSupported(account.coin, account.chain)
  if (!supported)
    return { ...account, warning: WARNING_UNSUPPORTED_PARAMS + ` ${account.chain} ${account.coin}` }

  // If warning, clear and continue to processing
  const { warning, ...accNoWarning } = account
  return accNoWarning
}

const toGetBalances = (getBalance: GetBalance) => (accounts: Account[], config: BalanceConfig) => {
  return accounts.map((acc) => getBalance(acc, config))
}

export type TBalanceInputParameters = {
  dataPath?: string
  confirmations?: number
  addresses?: Record<string, string>[]
  result?: Record<string, string>[]
}
export const inputParameters: InputParameters<TBalanceInputParameters> = {
  dataPath: { required: false },
  confirmations: { required: false },
  addresses: { required: false },
  result: { required: false },
}

export const make: ExecuteFactory<BalanceConfig, AdapterData> = (config) => async (input) => {
  const validator = new Validator(input, inputParameters)

  if (!config) throw new AdapterConfigError({ message: 'No configuration supplied' })

  config.confirmations = validator.validated.data.confirmations || DEFAULT_CONFIRMATIONS
  const jobRunID = validator.validated.id
  const dataPath = validator.validated.data.dataPath || DEFAULT_DATA_PATH
  const accounts = requireArray(jobRunID, dataPath, input.data).map((acc) =>
    toValidAccount(jobRunID, acc, config),
  )
  const accountsToProcess = accounts.filter((acc) => !acc.warning)

  const getBalances = config.getBalances || toGetBalances(config.getBalance)

  const key = (acc: Account) => `${acc.coin}-${acc.chain}`
  const groups = Array.from(util.groupBy(accountsToProcess, key).values())
  const requests = groups.flatMap((group) => getBalances(group as Account[], config))
  const responses = await Promise.all(requests)
  const responseLookup = Object.fromEntries<Account>(
    responses.flatMap((r) => r.result).map((a) => [`${a.address}-${a.coin}-${a.chain}`, a]),
  )

  const data: SequenceResponseData<Account> = {
    responses: responses.map((r: any) => r.payload),
    result: accounts.map((a) => responseLookup[`${a.address}-${a.coin}-${a.chain}`] || a),
  }

  if (!config.verbose) delete data.responses

  return { jobRunID, statusCode: 200, data, result: data.result } as any
}
