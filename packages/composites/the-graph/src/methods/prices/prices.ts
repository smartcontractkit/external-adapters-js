import { AdapterError, Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { Config, USD, USDT, WETH } from "../../config"
import { AdapterRequest, AdapterResponse } from "@chainlink/types"
import { getToken, getTokenPairPrice, getUSDPriceInUSDT } from "./dataProvider"
import { ethers } from "ethers"

const customParams = {
    baseCoinTicker: false,
    quoteCoinTicker: false,
    dex: false
}

export const execute = async (input: AdapterRequest, config: Config, provider: ethers.providers.Provider): Promise<AdapterResponse> => {
    Logger.info(`Making requests to ${config.endpoint}`)
    const validator = new Validator(input, customParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id
    const { baseCoinTicker = USD, quoteCoinTicker = USD } = validator.validated.data

    if (baseCoinTicker === quoteCoinTicker) {
        throw new AdapterError({ jobRunID, message: "Base and Quote coins must be different" })
    }

    Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair`)
    const wethToken = await getToken(jobRunID, WETH)
    const wethTokenAddress = wethToken.id

    let price
    try {
        if (baseCoinTicker === USD || quoteCoinTicker === USD) {
            price = await getTokenPriceInUSD(jobRunID, baseCoinTicker, quoteCoinTicker, wethTokenAddress, provider)
        } else {
            price = await getQuotePrice(jobRunID, baseCoinTicker, quoteCoinTicker, wethTokenAddress)
        }
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

const getTokenPriceInUSD = async (jobRunID: string, baseCoinTicker: string, quoteCoinTicker: string, wethTokenAddress: string, provider: ethers.providers.Provider) => {
    const tokenTicker = baseCoinTicker === USD ? quoteCoinTicker : baseCoinTicker
    const token0PerETH = await getQuotePrice(jobRunID, WETH, tokenTicker, wethTokenAddress)
    const ETHPerUSDT = await getQuotePrice(jobRunID, USDT, WETH, wethTokenAddress)
    validateTokenPrices(jobRunID, token0PerETH, ETHPerUSDT, baseCoinTicker, WETH)
    const USDTPerUSD = await getUSDPriceInUSDT(provider)
    if (baseCoinTicker === USD) {
        const token0PerUSDT = (token0PerETH as number) * (ETHPerUSDT as number)
        return token0PerUSDT * USDTPerUSD
    } else {
        const USDTPerEth = 1 / (ETHPerUSDT as number)
        const ETHPerToken0 = 1 / (token0PerETH as number)
        const USDTPerToken0 = USDTPerEth * ETHPerToken0
        const USDPerUSDT = 1 / USDTPerUSD
        return USDPerUSDT * USDTPerToken0
    }
}

const getQuotePrice = async (jobRunID: string, baseCoinTicker: string, quoteCoinTicker: string, wethTokenAddress: string): Promise<number> => {
    const token0 = await getToken(jobRunID, baseCoinTicker)
    const token1 = await getToken(jobRunID, quoteCoinTicker)
    const token1PerToken0 = await getTokenPairPrice(jobRunID, token0.id, token1.id)
    if (token1PerToken0) {
        return token1PerToken0
    }
    const ETHPerToken0 = await getTokenPairPrice(jobRunID, token0.id, wethTokenAddress)
    const ETHPerToken1 = await getTokenPairPrice(jobRunID, token1.id, wethTokenAddress)
    validateTokenPrices(jobRunID, ETHPerToken0, ETHPerToken1, baseCoinTicker, quoteCoinTicker)
    return (ETHPerToken0 as number) / (ETHPerToken1 as number)
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