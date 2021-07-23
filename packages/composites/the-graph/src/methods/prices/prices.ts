import { Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { Config, CURVE, DEFAULT_ORACLE_ADDRESS, UNISWAP, WETH } from '../../config'
import { AdapterRequest, AdapterResponse } from "@chainlink/types"
import { DexUniswapSubgraph, DexQueryInputParams, ReferenceModifierAction, DexCurveSubgraph, PoolBalance, UnderlyingCoins } from '../../types'
import { getLatestAnswer, getRpcLatestRound } from '@chainlink/ea-reference-data-reader'
import { UniswapSubgraph } from './dex/uniswap'
import { CurveSubgraph } from './dex/curve'
import { Decimal } from 'decimal.js'

export const NAME = 'price'

const customParams = {
  baseCoinTicker: ['baseCoinTicker', 'base', 'from', 'coin'],
  quoteCoinTicker: ['quoteCoinTicker', 'quote', 'to', 'market'],
  dex: true,
  intermediaryToken: false,
  referenceContract: false,
  referenceContractDivisor: false,
  theGraphQuote: false,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
    const validator = new Validator(input, customParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id
    const inputParams = validator.validated.data
    if (!inputParams.theGraphQuote && !inputParams.quoteCoinTicker) {
        throw new Error("quoteCoinTicker cannot be empty if theGraphQuote not supplied")
    }
    const dexToUpperCase = inputParams.dex.toUpperCase()
    const dexSubgraph = config.dexSubgraphs[dexToUpperCase]
    if (!dexSubgraph) {
        throw new Error(`${inputParams.dex} is currently not supported`)
    }
    let price
    switch(dexToUpperCase) {
        case UNISWAP:
            price = await executeUniswap(jobRunID, inputParams, dexSubgraph as UniswapSubgraph)
            break;
        case CURVE:
            price = await executeCurve(jobRunID, inputParams, dexSubgraph as CurveSubgraph)
            break;
        default:
            price = await executeUniswap(jobRunID, inputParams, dexSubgraph as UniswapSubgraph)
            break;
    }
    return Requester.success(jobRunID, {
        status: 200,
        data: {
            result: price
        }
    }, true)
}

export const executeCurve = async(jobRunID: string, input: DexQueryInputParams, dexSubgraph: CurveSubgraph): Promise<Decimal> => {
    const { baseCoinTicker, quoteCoinTicker } = input
    if (baseCoinTicker === quoteCoinTicker) {
        throw new Error("Base and Quote coins must be different")
    }
    let price
    try {
        price = await getPoolPrice(jobRunID, input, dexSubgraph)
    } catch (e) {
        throw new Error(`Failed to get price. Reason "${e}"` )
    }
    return price
}

const getPoolPrice = async (jobRunID: string, input: DexQueryInputParams, dexSubgraph: DexCurveSubgraph): Promise<Decimal> => {
    const { baseCoinTicker, quoteCoinTicker, referenceContract} = input
    const tokenPollsName = await dexSubgraph.getTokenPoolName(jobRunID, quoteCoinTicker)
    Logger.info(`Founded ${tokenPollsName.length} pools`)
    const balances = await Promise.all(tokenPollsName.map(async (name:string) => {
        const pools = await dexSubgraph.getPool(jobRunID, name);
        Logger.info(`Fetching balance from '${name}' pool`)
        let token0Balance
        let token1Balance
        pools.underlyingCoins.map((pool:UnderlyingCoins) => {
            if(quoteCoinTicker === pool.token.symbol){
                token0Balance = pool.balance
            }
            if(baseCoinTicker === pool.token.symbol) {
                token1Balance = pool.balance
            }
        })
        if(token0Balance === undefined || token1Balance === undefined) {
            Logger.info(`'${name}' pool doesn't have both tokens`)
            return null
        }
        return { token0Balance, token1Balance }
    }))
    const pool = balances.filter(pool => pool) as PoolBalance[]
    if(!pool.length) {
        throw new Error(`There is not a ${quoteCoinTicker}/${baseCoinTicker} pool`)
    }
    const token0Balance = pool[0].token0Balance
    const token1Balanace = pool[0].token1Balance
    const poolUnderlyingPrice = token1Balanace/token0Balance
    Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is ${poolUnderlyingPrice}`)
    const usdFeedPrice = await getFeedPrice(referenceContract)
    Logger.info(`Price of ${baseCoinTicker}/USD is ${usdFeedPrice}`)
    const price = usdFeedPrice.mul(poolUnderlyingPrice)
    Logger.info(`Price of ${quoteCoinTicker}/USD is ${price}`)
    return price
}

const getFeedPrice = async (referenceContract: string): Promise<Decimal> => {
    const multiply = 1e8
    let oracleAddress = referenceContract
    if(!oracleAddress) {
        oracleAddress = DEFAULT_ORACLE_ADDRESS
    }
    const roundData = await getRpcLatestRound(oracleAddress)
    const usdPrice = new Decimal(roundData.answer.toString()).div(multiply)
    return usdPrice
}

export const executeUniswap = async (jobRunID: string, input: DexQueryInputParams, dexSubgraph: UniswapSubgraph): Promise<number> => {
    const { 
        baseCoinTicker, 
        quoteCoinTicker, 
        dex, 
        referenceContract, 
        referenceContractDivisor, 
        referenceModifierAction = ReferenceModifierAction.MULTIPLY, 
        intermediaryToken = WETH,
        theGraphQuote 
    } = input

    const inputParams: DexQueryInputParams = {
        jobRunID,
        baseCoinTicker: baseCoinTicker.toUpperCase(),
        quoteCoinTicker: theGraphQuote ? theGraphQuote.toUpperCase() : quoteCoinTicker.toUpperCase(),
        dex: UNISWAP,
        referenceContract,
        referenceContractDivisor,
        referenceModifierAction: referenceModifierAction.toUpperCase() as ReferenceModifierAction,
        intermediaryToken: intermediaryToken.toUpperCase(),
        theGraphQuote
    }
    if (baseCoinTicker === quoteCoinTicker) {
        throw new Error("Base and Quote coins must be different")
    }
    Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair from ${dex}`)
    let price
    try {
        price = await getQuotePrice(inputParams, dexSubgraph)
    } catch (e) {
        throw new Error(`Failed to get price.  Reason "${e}"`)
    }
    return price
}

const getQuotePrice = async (inputParams: DexQueryInputParams, dexSubgraph: DexUniswapSubgraph): Promise<number> => {
    const { jobRunID, baseCoinTicker, quoteCoinTicker, referenceContract } = inputParams
    const token0 = await dexSubgraph.getToken(jobRunID, baseCoinTicker)
    const token1 = await dexSubgraph.getToken(jobRunID, quoteCoinTicker)
    let token1PerToken0 = await dexSubgraph.getTokenPairPrice(jobRunID, token0.id, token1.id)
    if (!token1PerToken0) {
        token1PerToken0 = await getPriceThroughCommonPair(inputParams, dexSubgraph, token0.id, token1.id)
    }
    Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is ${token1PerToken0}`)
    if (referenceContract) {
        token1PerToken0 = await modifyResultByFeedResult(inputParams, token1PerToken0)
    }
    return token1PerToken0
}

const getPriceThroughCommonPair = async (inputParams: DexQueryInputParams, dexSubgraph: DexUniswapSubgraph, token0ID: string, token1ID: string): Promise<number> => {
    const { jobRunID, baseCoinTicker, quoteCoinTicker, intermediaryToken: intermediaryTokenTicker } = inputParams
    Logger.info(`${quoteCoinTicker}/${baseCoinTicker} pair does not exist.  Determining price using intermediary token ${intermediaryTokenTicker}`)
    const intermediaryToken = await dexSubgraph.getToken(jobRunID, intermediaryTokenTicker)
    const refTokenPerToken0 = await dexSubgraph.getTokenPairPrice(jobRunID, token0ID, intermediaryToken.id)
    const refTokenPerToken1 = await dexSubgraph.getTokenPairPrice(jobRunID, token1ID, intermediaryToken.id)
    validateTokenPrices(refTokenPerToken0, refTokenPerToken1, baseCoinTicker, quoteCoinTicker)
    return (refTokenPerToken0 as number) / (refTokenPerToken1 as number)
}

const validateTokenPrices = (
  priceOne: number | null,
  priceTwo: number | null,
  priceOneTicker: string,
  priceTwoTicker: string,
) => {
  if (!priceOne || !priceTwo) {
    if (!priceOne) {
      throw new Error(
        `Failed to get price because we could not determine the price of ${priceOneTicker}`,
      )
    }
    if (!priceTwo) {
      throw new Error(
        `Failed to get price because we could not determine the price of ${priceTwoTicker}`,
      )
    }
  }
}

const modifyResultByFeedResult = async (
  inputParams: DexQueryInputParams,
  currentPrice: number,
): Promise<number> => {
  const {
    baseCoinTicker,
    quoteCoinTicker,
    referenceContract,
    referenceContractDivisor,
    referenceModifierAction,
  } = inputParams
  Logger.info(
    `Price of ${quoteCoinTicker}/${baseCoinTicker} is going to be modified by the result returned from ${referenceContract} by ${referenceContractDivisor}`,
  )
  const modifierTokenPrice = await getLatestAnswer(referenceContract, referenceContractDivisor)
  Logger.info(`Feed ${referenceContract} returned a value of ${modifierTokenPrice}`)
  if (referenceModifierAction === ReferenceModifierAction.DIVIDE) {
    return currentPrice / modifierTokenPrice
  }
  return currentPrice * modifierTokenPrice
}
