import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName, Config, ROUTER_CONTRACT } from '../config'
import { ethers, BigNumber } from 'ethers'
import { BigNumber as BigNumberJs } from 'bignumber.js'
import routerABI from '../abis/router.json'
import erc20ABI from '../abis/ERC20.json'
import addressProviderABI from '../abis/address_provider.json'
import registryExchangesABI from '../abis/registry_exchanges.json'
import { Decimal } from 'decimal.js'
import * as a from './end'

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

export const inputParameters: InputParameters = {
  from: ['base', 'from', 'coin'],
  fromAddress: false,
  fromDecimals: false,
  to: ['quote', 'to', 'market'],
  toAddress: false,
  toDecimals: false,
  amount: false,
  resultPath: false,
}

type tokenDetails = { address: string; decimals: number }

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const fromDetailed = await getTokenDetails(validator, 'from', config)
  const toDetailed = await getTokenDetails(validator, 'to', config)
  const inputAmount = validator.validated.data.amount || 1
  const amount = BigNumber.from(inputAmount).mul(BigNumber.from(10).pow(fromDetailed.decimals))
  const resultPath = validator.validated.data.resultPath

  const output = await getBestRate(fromDetailed, toDetailed, amount, config)

  const outputAmount = new Decimal(output.toString()).div(new Decimal(10).pow(toDetailed.decimals))
  const rate = outputAmount.div(inputAmount)

  const data: ResponseSchema = {
    input: amount.toString(),
    inputToken: fromDetailed.address,
    inputDecimals: fromDetailed.decimals,
    output: output.toString(),
    outputToken: toDetailed.address,
    outputDecimals: toDetailed.decimals,
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
  validator: Validator,
  direction: string,
  config: Config,
): Promise<tokenDetails> => {
  const symbol = validator.overrideSymbol(
    AdapterName,
    validator.validated.data[direction],
  ) as string
  const address =
    validator.validated.data[`${direction}Address`] ||
    validator.overrideToken(symbol, config.network) ||
    symbol
  const decimals =
    validator.validated.data[`${direction}Decimals`] || (await getDecimals(address, config))

  return { address, decimals }
}

const getDecimals = async (address: string, config: Config): Promise<number> =>
  new ethers.Contract(address, erc20ABI, config.provider).decimals()

const getBestRate = async (
  from: tokenDetails,
  to: tokenDetails,
  amount: BigNumber,
  config: Config,
): Promise<BigNumberJs> => {
  // discover the address of the factory contract
  console.log('begofore', ROUTER_CONTRACT)
  const router = new ethers.Contract(ROUTER_CONTRACT, routerABI, config.provider)

  const factoryContract = await router.factory()

  const amt = await router.getAmountsOut(amount, [from.address, to.address])

  return amt[1]

  // discover the liquidity pool for the token pair
  const provider = new ethers.Contract(factoryContract, addressProviderABI, config.provider)

  const exchangePairAddr = await provider.getPair(from.address, to.address)

  console.log('pair', exchangePairAddr)

  // now swap!
  const swaps = new ethers.Contract(exchangePairAddr, registryExchangesABI, config.provider)
  const r = await swaps.getReserves()

  // `ethers` bignumber can't handle fractions
  // do the conversion between types to no loose precision
  const reserve0: BigNumberJs = new BigNumberJs(r._reserve0.toString())
  const reserve1: BigNumberJs = new BigNumberJs(r._reserve1.toString())

  if (reserve0.isZero()) {
    throw new Error(`No liquidity for pair`)
  }

  const price = reserve1.div(reserve0)

  return price
}
