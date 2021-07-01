import { AdapterError, Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { Config, WETH, UNISWAP } from "../../config"
import { AdapterRequest, AdapterResponse } from "@chainlink/types"
import { DexSubgraph, DexQueryInputParams, ReferenceModifierAction } from "../../types"
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'

export const PRICE = "price"

const customParams = {
    baseCoinTicker: true,
    quoteCoinTicker: true,
    dex: false,
    intermediaryToken: false ,
    referenceContract: false,
    referenceMagnitude: false 
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
    const validator = new Validator(input, customParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id
    const { 
        baseCoinTicker, 
        quoteCoinTicker, 
        dex = UNISWAP, 
        referenceContract, 
        referenceMagnitude, 
        referenceAction = ReferenceModifierAction.MULTIPLY, 
        intermediaryToken = WETH 
    } = validator.validated.data
    const inputParams: DexQueryInputParams = {
        jobRunID,
        baseCoinTicker: baseCoinTicker.toUpperCase(),
        quoteCoinTicker: quoteCoinTicker.toUpperCase(),
        dex: dex.toUpperCase(),
        referenceContract,
        referenceMagnitude,
        referenceAction: referenceAction.toUpperCase() as ReferenceModifierAction,
        intermediaryToken: intermediaryToken.toUpperCase(),
    }
    if (baseCoinTicker === quoteCoinTicker) {
        throw new AdapterError({ jobRunID, message: "Base and Quote coins must be different" })
    }
    Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair from ${dex}`)
    const dexSubgraph = config.dexSubgraphs[dex]
    let price
    try {
        price = await getQuotePrice(inputParams, dexSubgraph)
    } catch (e) {
        throw new AdapterError({ jobRunID, message: `Failed to get price.  Reason "${e}"` })
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
    validateTokenPrices(jobRunID, refTokenPerToken0, refTokenPerToken1, baseCoinTicker, quoteCoinTicker)
    return (refTokenPerToken0 as number) / (refTokenPerToken1 as number)
}

const validateTokenPrices = (jobRunID: string, priceOne: number | null, priceTwo: number | null, priceOneTicker: string, priceTwoTicker: string) => {
    if (!priceOne || !priceTwo) {
        if (!priceOne) {
            throw new AdapterError({ jobRunID, message: `Failed to get price because we could not determine the price of ${priceOneTicker}` })
        }
        if (!priceTwo) {
            throw new AdapterError({ jobRunID, message: `Failed to get price because we could not determine the price of ${priceTwoTicker}` })
        }
    }
}

const modifyResultByFeedResult = async (inputParams: DexQueryInputParams, currentPrice: number): Promise<number> => {
    const { baseCoinTicker, quoteCoinTicker, referenceContract, referenceMagnitude, referenceAction  } = inputParams
    Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is going to be modified by the result returned from ${referenceContract} by ${referenceMagnitude}`)
    const modifierTokenPrice = await getLatestAnswer(referenceContract, referenceMagnitude)
    Logger.info(`Feed ${referenceContract} returned a value of ${modifierTokenPrice}`)
    if(referenceAction === ReferenceModifierAction.DIVIDE) {
        return currentPrice / modifierTokenPrice
    }
    return currentPrice * modifierTokenPrice
}
