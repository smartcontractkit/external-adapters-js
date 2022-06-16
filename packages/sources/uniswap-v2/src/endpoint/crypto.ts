import { Requester, Validator, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName, Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import uniswapRouterV2ABI from '../abis/uniswap_v2_router_02.json'
import erc20ABI from '../abis/ERC20.json'
import { Decimal } from 'decimal.js'

export const description = 'Gets the exchange rate between two tokens'

export const supportedEndpoints = ['crypto']

export const endpointResultPaths = {
  crypto: 'rate',
}

export interface ResponseSchema {
  input: string
  inputToken: string
  inputDecimals: number
  output: string
  outputToken: string
  outputDecimals: number
  rate: number
}

export type TInputParameters = {
  from: string
  fromAddress?: string
  fromDecimals?: number
  to: string
  toAddress?: string
  toDecimals?: number
  amount?: number
}
export const inputParameters: InputParameters<TInputParameters> = {
  from: {
    aliases: ['base', 'coin'],
    required: true,
    description: 'The symbol or address of the currency to query',
    type: 'string',
  },
  fromAddress: {
    required: false,
    description:
      'Optional param to pre-define the address to convert from. If set, it takes precedence over `from` ',
    type: 'string',
  },
  fromDecimals: {
    required: false,
    description:
      'Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster',
    type: 'number',
  },
  to: {
    aliases: ['quote', 'market'],
    required: true,
    description: 'The symbol or address of the currency to convert to',
    type: 'string',
  },
  toAddress: {
    required: false,
    description:
      'Optional param to pre-define the address to convert to. If set, it takes precedence over `to`',
    type: 'string',
  },
  toDecimals: {
    required: false,
    description:
      'Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster',
    type: 'number',
  },
  amount: {
    required: false,
    description:
      'The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH',
    default: 1,
    type: 'number',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const { address: from, decimals: fromDecimals } = await getTokenDetails(validator, 'from', config)
  const { address: to, decimals: toDecimals } = await getTokenDetails(validator, 'to', config)
  const inputAmount = validator.validated.data.amount || 1
  const amount = BigNumber.from(inputAmount).mul(BigNumber.from(10).pow(fromDecimals))
  const resultPath = validator.validated.data.resultPath

  let output
  try {
    ;[, output] = await getBestRate(from, to, amount, config)
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
  const result = Requester.validateResultNumber(response.data, resultPath)

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
  direction: 'from' | 'to',
  config: Config,
): Promise<{ address: string; decimals: number }> => {
  const symbol = validator.overrideSymbol(
    AdapterName,
    validator.validated.data[direction].toString(),
  )
  const address = (
    (validator.validated.data as any)[`${direction}Address`] ||
    validator.overrideToken(symbol, config.network) ||
    symbol
  ).toString()
  let decimals
  try {
    decimals =
      (validator.validated.data as any)[`${direction}Decimals`] || (await getDecimals(address, config))
  } catch (e) {
    throw new AdapterDataProviderError({
      network: config.network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  return { address, decimals }
}

const getDecimals = async (address: string, config: Config): Promise<number> =>
  new ethers.Contract(address, erc20ABI, config.provider).decimals()

const getBestRate = async (
  from: string,
  to: string,
  amount: BigNumber,
  config: Config,
): Promise<[amountIn: BigNumber, output: BigNumber]> => {
  const uniRouter = new ethers.Contract(config.uniswapRouter, uniswapRouterV2ABI, config.provider)
  return await uniRouter.getAmountsOut(amount, [from, to])
}
