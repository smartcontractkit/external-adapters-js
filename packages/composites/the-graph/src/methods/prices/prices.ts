import { AdapterError, Validator, Requester } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config, USD, USDT, WETH } from "../../config"
import { getToken, getTokenPairPrice } from "./dataProvider"

const customParams = {
    baseCoinSymbol: true,
    quoteCoinSymbol: false,
    dex: false
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
    console.log(`Making requests to ${config.endpoint}`)
    const validator = new Validator(input, customParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id
    const { baseCoinSymbol, quoteCoinSymbol = USD } = validator.validated.data
    const wethToken = await getToken(jobRunID, WETH)
    const wethTokenAddress = wethToken.id

    let price
    try {
        if (quoteCoinSymbol === USD) {
            price = await getTokenPriceInUSD(jobRunID, baseCoinSymbol, wethTokenAddress)
        } else {
            price = await getToken1PriceInToken0(jobRunID, baseCoinSymbol, quoteCoinSymbol, wethTokenAddress)
        }
    } catch (e) {
        throw new AdapterError({ jobRunID, message: `Failed to get price` })
    }
    return Requester.success(jobRunID, {
        status: 200,
        data: {
            result: price
        }
    }, true)
}

const getTokenPriceInUSD = async (jobRunID: string, baseCoinSymbol: string, wethTokenAddress: string) => {
    const token0 = await getToken(jobRunID, baseCoinSymbol)
    const token0PerETH = await getTokenPairPrice(jobRunID, wethTokenAddress, token0.id)
    const usdtToken = await getToken(jobRunID, USDT)
    const ETHPerUSDT = await getTokenPairPrice(jobRunID, usdtToken.id, wethTokenAddress)
    if (token0PerETH == null || ETHPerUSDT == null) {
        throw new Error()
    }
    const token0PerUSDT = token0PerETH * ETHPerUSDT
    return token0PerUSDT
    // todo
    // 1) Convert USDT to USD using feeds
}

const getToken1PriceInToken0 = async (jobRunID: string, baseCoinSymbol: string, quoteCoinSymbol: string, wethTokenAddress: string): Promise<number> => {
    const token0 = await getToken(jobRunID, baseCoinSymbol)
    const token1 = await getToken(jobRunID, quoteCoinSymbol)
    const token1PerToken0 = await getTokenPairPrice(jobRunID, token0.id, token1.id)
    if (token1PerToken0) {
        return token1PerToken0
    }
    const ETHPerToken0 = await getTokenPairPrice(jobRunID, token0.id, wethTokenAddress)
    const ETHPerToken1 = await getTokenPairPrice(jobRunID, token1.id, wethTokenAddress)
    if (ETHPerToken0 == null || ETHPerToken1 == null) {
        throw new Error()
    }
    return ETHPerToken0 / ETHPerToken1
}