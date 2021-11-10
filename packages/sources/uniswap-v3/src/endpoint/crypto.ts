import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName, Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import quoterABI from '../abis/quoter.json'
import erc20ABI from '../abis/ERC20.json'
import { Decimal } from 'decimal.js'

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
  feeTiers: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const { address: from, decimals: fromDecimals } = await getTokenDetails(validator, 'from', config)
  const { address: to, decimals: toDecimals } = await getTokenDetails(validator, 'to', config)
  const inputAmount = validator.validated.data.amount || 1
  const amount = BigNumber.from(inputAmount).mul(BigNumber.from(10).pow(fromDecimals))
  const resultPath = validator.validated.data.resultPath

  const feeTiers = validator.validated.data.feeTiers || config.feeTiers
  const output = await getBestRate(from, to, amount, feeTiers, config)

  if (output.eq(0)) {
    throw new Error('Quoted output was zero. This pool or fee tier may not exist')
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
): Promise<{ address: string; decimals: number }> => {
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
  from: string,
  to: string,
  amount: BigNumber,
  feeTiers: number[],
  config: Config,
): Promise<BigNumber> => {
  // pull abi from file
  const quoterContract = new ethers.Contract(config.uniswapQuoter, quoterABI, config.provider)

  // encode inputs for quoteExactInputSingle
  const sqrtPriceLimitX96 = 0
  let bestPrice = BigNumber.from(0)

  // iterate over fee tiers
  for (const fee of feeTiers) {
    try {
      // execute non view function as a call
      const price = await quoterContract.callStatic.quoteExactInputSingle(
        from,
        to,
        fee,
        amount,
        sqrtPriceLimitX96,
      )
      // update best price by largest amount out
      if (price > bestPrice) {
        bestPrice = price
      }
    } catch (error) {
      console.error(`Failed with: ${error}`)
    }
  }

  return bestPrice
}
