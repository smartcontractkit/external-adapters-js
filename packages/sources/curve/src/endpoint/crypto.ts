import { AdapterDataProviderError, util, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName, Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import addressProviderABI from '../abis/address_provider.json'
import registryExchangesABI from '../abis/registry_exchanges.json'
import erc20ABI from '../abis/ERC20.json'
import { Decimal } from 'decimal.js'
import { sleep } from '../../../../core/bootstrap/dist/lib/util'

export const supportedEndpoints = ['crypto']

export const endpointResultPaths = {
  crypto: 'rate',
}

export interface ResponseSchema {
  pool: string
  input: string
  inputToken: string
  inputDecimals: number
  output: string
  outputToken: string
  outputDecimals: number
  rate: number
}

export const description = 'Gets the exchange rate between two tokens'

export type TInputParameters = {
  from: string
  fromAddress: string
  fromDecimals: number
  to: string
  toAddress: string
  toDecimals: number
  amount: number
  [name: string]: number | string
}
export const inputParameters: InputParameters<TInputParameters> = {
  from: {
    aliases: ['base', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  fromAddress: {
    description:
      'Optional param to pre-define the address to convert from. If set, it takes precedence over `from`',
    type: 'string',
  },
  fromDecimals: {
    description:
      ' Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster',
    type: 'number',
  },
  to: {
    aliases: ['quote', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  toAddress: {
    description:
      'Optional param to pre-define the address to convert to. If set, it takes precedence over `to`',
    type: 'string',
  },
  toDecimals: {
    description:
      'Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster',
    type: 'number',
  },
  amount: {
    description:
      ' The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH',
    type: 'number',
    default: 1,
  },
}
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const { address: from, decimals: fromDecimals } = await getTokenDetails(validator, 'from', config)
  const { address: to, decimals: toDecimals } = await getTokenDetails(validator, 'to', config)
  const inputAmount = validator.validated.data.amount
  const amount = BigNumber.from(inputAmount).mul(BigNumber.from(10).pow(fromDecimals))
  const resultPath = (validator.validated.data.resultPath || '').toString()

  let pool
  let output
  try {
    ;[pool, output] = await getBestRate(from, to, amount, config)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: config.network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const outputAmount = new Decimal(output.toString()).div(new Decimal(10).pow(toDecimals))
  const rate = outputAmount.div(inputAmount)

  const data: ResponseSchema = {
    pool,
    input: amount.toString(),
    inputToken: from,
    inputDecimals: fromDecimals,
    output: output.toString(),
    outputToken: to,
    outputDecimals: toDecimals,
    rate: rate.toNumber(),
  }

  const response = {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: data,
  }

  const result = Requester.validateResultNumber(response.data, [resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

/**
 * getTokenDetails will find the address and number of decimal for a token.
 *
 * The order of operations is as follows:
 *  - address:
 *     1. Check if the address was provided in the request.
 *     2. If not, check the symbol in the request to see if we have pre-set the address for this symbol/network.
 *     3. If not, we assume the symbol param was actually the address.
 *  - decimals:
 *     1. Check if the number of decimals was provided in the request.
 *     2. Query the contract at the address found above to see how many decimals it's set to.
 * @param validator The validation class to use
 * @param direction Used to get the params in the request
 * - `{direction}` is the symbol of the token (to find pre-set token details)
 * - `{direction}Address` is the token address as set in the request
 * - `{direction}Decimals` is the number of decimals for the token as set in the request
 * @param config Configuration to extract token decimals from
 */
const getTokenDetails = async (
  validator: Validator<TInputParameters>,
  direction: string,
  config: Config,
): Promise<{ address: string; decimals: number }> => {
  const symbol = validator.overrideSymbol<string>(
    AdapterName,
    validator.validated.data[direction].toString(),
  )
  const address =
    validator.validated.data[`${direction}Address`] ||
    validator.overrideToken(symbol, config.network) ||
    symbol
  let decimals

  try {
    decimals =
      validator.validated.data[`${direction}Decimals`] || (await getDecimals(address.toString(), config))
  } catch (e) {
    throw new AdapterDataProviderError({
      network: config.network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  return { address: address.toString(), decimals: Number(decimals) }
}

const getDecimals = async (address: string, config: Config): Promise<number> =>
  new ethers.Contract(address, erc20ABI, config.provider).decimals()

const getBestRate = async (
  from: string,
  to: string,
  amount: BigNumber,
  config: Config,
): Promise<[pool: string, output: BigNumber]> => {
  const provider = new ethers.Contract(
    config.addressProviderAddress,
    addressProviderABI,
    config.provider,
  )
  const exchange = await provider.get_address(config.exchangeProviderId)
  const swaps = new ethers.Contract(exchange, registryExchangesABI, config.provider)
  return swaps.get_best_rate(from, to, amount)
}
