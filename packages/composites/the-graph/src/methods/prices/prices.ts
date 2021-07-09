import { Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { Config, WETH } from "../../config"
import { AdapterRequest, AdapterResponse } from "@chainlink/types"
import { DexSubgraph, DexQueryInputParams, ReferenceModifierAction } from "../../types"
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'

export const NAME = "price"

const customParams = {
    baseCoinTicker: ["baseCoinTicker", "base", "from", "coin"],
    quoteCoinTicker: ["quoteCoinTicker", "quote", "to", "market"],
    dex: true,
    intermediaryToken: false,
    referenceContract: false,
    referenceContractDivisor: false,
    theGraphQuote: false 
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
    const validator = new Validator(input, customParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id
    const { 
        baseCoinTicker, 
        quoteCoinTicker, 
        dex, 
        referenceContract, 
        referenceContractDivisor, 
        referenceModifierAction = ReferenceModifierAction.MULTIPLY, 
        intermediaryToken = WETH,
        theGraphQuote 
    } = validator.validated.data
    if (!theGraphQuote && !quoteCoinTicker) {
        throw new Error("quoteCoinTicker cannot be empty if theGraphQuote not supplied")
    }
    const dexToUpperCase = dex.toUpperCase()
    const dexSubgraph = config.dexSubgraphs[dexToUpperCase]
    if (!dexSubgraph) {
        throw new Error(`${dex} is currently not supported`)
    }
    const inputParams: DexQueryInputParams = {
        jobRunID,
        baseCoinTicker: baseCoinTicker.toUpperCase(),
        quoteCoinTicker: theGraphQuote ? theGraphQuote.toUpperCase() : quoteCoinTicker.toUpperCase(),
        dex: dexToUpperCase,
        referenceContract,
        referenceContractDivisor,
        referenceModifierAction: referenceModifierAction.toUpperCase() as ReferenceModifierAction,
        intermediaryToken: intermediaryToken.toUpperCase(),
    }
    if (baseCoinTicker === quoteCoinTicker) {
        throw new Error("Base and Quote coins must be different")
    }
    Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair from ${dex}`)
    let price
    try {
        price = await getQuotePrice(inputParams, dexSubgraph)
    } catch (e) {
        throw new Error(`Failed to get price.  Reason "${e}"` )
    }
    return Requester.success(jobRunID, {
        status: 200,
        data: {
            result: price
        }
    }, true)
}

const getQuotePrice = async (inputParams: DexQueryInputParams, dexSubgraph: DexSubgraph): Promise<number> => {
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

const getPriceThroughCommonPair = async (inputParams: DexQueryInputParams, dexSubgraph: DexSubgraph, token0ID: string, token1ID: string): Promise<number> => {
    const { jobRunID, baseCoinTicker, quoteCoinTicker, intermediaryToken: intermediaryTokenTicker } = inputParams
    Logger.info(`${quoteCoinTicker}/${baseCoinTicker} pair does not exist.  Determining price using intermediary token ${intermediaryTokenTicker}`)
    const intermediaryToken = await dexSubgraph.getToken(jobRunID, intermediaryTokenTicker)
    const refTokenPerToken0 = await dexSubgraph.getTokenPairPrice(jobRunID, token0ID, intermediaryToken.id)
    const refTokenPerToken1 = await dexSubgraph.getTokenPairPrice(jobRunID, token1ID, intermediaryToken.id)
    validateTokenPrices(refTokenPerToken0, refTokenPerToken1, baseCoinTicker, quoteCoinTicker)
    return (refTokenPerToken0 as number) / (refTokenPerToken1 as number)
}

const validateTokenPrices = (priceOne: number | null, priceTwo: number | null, priceOneTicker: string, priceTwoTicker: string) => {
    if (!priceOne || !priceTwo) {
        if (!priceOne) {
            throw new Error(`Failed to get price because we could not determine the price of ${priceOneTicker}`)
        }
        if (!priceTwo) {
            throw new Error(`Failed to get price because we could not determine the price of ${priceTwoTicker}`)
        }
    }
}

const modifyResultByFeedResult = async (inputParams: DexQueryInputParams, currentPrice: number): Promise<number> => {
    const { baseCoinTicker, quoteCoinTicker, referenceContract, referenceContractDivisor, referenceModifierAction  } = inputParams
    Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is going to be modified by the result returned from ${referenceContract} by ${referenceContractDivisor}`)
    const modifierTokenPrice = await getLatestAnswer(referenceContract, referenceContractDivisor)
    Logger.info(`Feed ${referenceContract} returned a value of ${modifierTokenPrice}`)
    if(referenceModifierAction === ReferenceModifierAction.DIVIDE) {
        return currentPrice / modifierTokenPrice
    }
    return currentPrice * modifierTokenPrice
}
