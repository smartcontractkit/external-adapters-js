import { Validator, AdapterError } from '@chainlink/external-adapter'
import Web3 from 'web3'
import { Execute, ExecuteFactory, Config, AdapterRequest } from '@chainlink/types'
import { ExecuteWithJobId, PriceUpdateParams } from 'dock/types'
import { makeConfig, makeCMCConfig, makeDockConfig, minimumAnswers } from './config'
import { cryptocompare, coingecko, coinmarketcap, binance } from './endpoint'
import { median, writePriceToChain } from './util'

export const MEDIAN_PRICE = 'median_price'
export const WRITE_CC_PRICE = `write_${cryptocompare.NAME}`
export const WRITE_CG_PRICE = `write_${coingecko.NAME}`
export const WRITE_CMC_PRICE = `write_${coinmarketcap.NAME}`
export const WRITE_BN_PRICE = `write_${binance.NAME}`
export const WRITE_MEDIAN_PRICE = `write_${MEDIAN_PRICE}`

const inputParams = {
  // Don't try to validate `endpoint` key
  endpoint: false,
}

// Helper to write price on chain
const writeToChain = async (request: AdapterRequest, jobRunID: string, price: number) => {
  const validator = new Validator(request, inputParams)
  const forceWrite = validator.validated.data.forceWrite || false
  const thresholdPct = validator.validated.data.thresholdPct || 0
  const idleRounds = validator.validated.data.idleRounds || 0
  const priceUpdate: PriceUpdateParams = {
    forceWrite,
    thresholdPct,
    idleTime: idleRounds,
    currentPrice: price,
  }
  const config = makeDockConfig()
  const web3 = new Web3(config.NODE_ENDPOINT)
  const signer = web3.eth.accounts.privateKeyToAccount(config.ORACLE_SK)
  const blockNumber = await writePriceToChain(
    web3,
    config.PROXY_ADDRESS,
    config.PROXY_ABI,
    config.AGGREGATOR_ABI,
    config.ORACLE_ADDRESS,
    signer,
    priceUpdate,
  )
  return {
    jobRunID: jobRunID,
    data: { result: blockNumber },
    result: blockNumber,
    statusCode: 200,
  }
}

// Writes price of DOCK/USD from coinmarketcap on chain
const executeWriteCmc: ExecuteWithJobId = async (request, jobRunID) => {
  const priceCmc = (await executeCmc(request, jobRunID)).result
  return writeToChain(request, jobRunID, priceCmc)
}

// Writes price of DOCK/USD from cryptocompare on chain
const executeWriteCc: ExecuteWithJobId = async (request, jobRunID) => {
  const priceCc = (await executeCc(request, jobRunID)).result
  return writeToChain(request, jobRunID, priceCc)
}

// Writes price of DOCK/USD from coingecko on chain
const executeWriteCg: ExecuteWithJobId = async (request, jobRunID) => {
  const priceCg = (await executeCg(request, jobRunID)).result
  return writeToChain(request, jobRunID, priceCg)
}

// Writes price of DOCK/USD from binance on chain
const executeWriteBn: ExecuteWithJobId = async (request, jobRunID) => {
  const priceBn = (await executeBn(request, jobRunID)).result
  return writeToChain(request, jobRunID, priceBn)
}

// Writes median price of DOCK/USD on chain
const executeWriteMedianPrice: ExecuteWithJobId = async (request, jobRunID) => {
  const priceCmc = (await executeMedianPrice(request, jobRunID)).result
  return writeToChain(request, jobRunID, priceCmc)
}

// Gets price of DOCK/USD from coinmarketcap
const executeCmc: ExecuteWithJobId = async (request, jobRunID) => {
  const config = makeCMCConfig()
  try {
    return coinmarketcap.execute(request, config)
  } catch (e) {
    throw new AdapterError({
      jobRunID,
      message: `Error while executing ${coinmarketcap.NAME} job: ${e}`,
      statusCode: 500,
    })
  }
}

// Gets price of DOCK/USD from cryptocompare
const executeCc: ExecuteWithJobId = async (request, jobRunID) => {
  const config = makeConfig()
  try {
    return cryptocompare.execute(request, config)
  } catch (e) {
    throw new AdapterError({
      jobRunID,
      message: `Error while executing ${cryptocompare.NAME} job: ${e}`,
      statusCode: 500,
    })
  }
}

// Gets price of DOCK/USD from coingecko
const executeCg: ExecuteWithJobId = async (request, jobRunID) => {
  const config = makeConfig()
  try {
    return coingecko.execute(request, config)
  } catch (e) {
    throw new AdapterError({
      jobRunID,
      message: `Error while executing ${coingecko.NAME} job: ${e}`,
      statusCode: 500,
    })
  }
}

// Gets price of DOCK/USD from binance
const executeBn: ExecuteWithJobId = async (request, jobRunID) => {
  const config = makeConfig()
  try {
    return binance.execute(request, config)
  } catch (e) {
    throw new AdapterError({
      jobRunID,
      message: `Error while executing ${binance.NAME} job: ${e}`,
      statusCode: 500,
    })
  }
}

// Gets median price of DOCK/USD after getting prices from coinmarketcap, cryptocompare, coingecko
const executeMedianPrice: ExecuteWithJobId = async (request, jobRunID) => {
  const prices = []

  // Try to get prices from as many sources as possible
  try {
    const priceCmc = (await executeCmc(request, jobRunID)).result
    prices.push(priceCmc)
  } catch (e) {
    console.warn(`Job ${jobRunID}: Could not fetch price for Coinmarketcap. Error ${e}`)
  }
  try {
    const priceCg = (await executeCg(request, jobRunID)).result
    prices.push(priceCg)
  } catch (e) {
    console.warn(`Job ${jobRunID}: Could not fetch price for Coingecko. Error ${e}`)
  }
  try {
    const priceCc = (await executeCc(request, jobRunID)).result
    prices.push(priceCc)
  } catch (e) {
    console.warn(`Job ${jobRunID}: Could not fetch price for Cryptocompare. Error ${e}`)
  }
  try {
    const priceBn = (await executeBn(request, jobRunID)).result
    prices.push(priceBn)
  } catch (e) {
    console.warn(`Job ${jobRunID}: Could not fetch price for Binance. Error ${e}`)
  }

  const min = minimumAnswers()
  if (prices.length < min) {
    const errorMsg = `Couldn't get prices from sufficient number of sources. Needed at least ${min} but got only ${prices.length}`
    console.error(errorMsg)
    throw new AdapterError({
      jobRunID,
      message: errorMsg,
      statusCode: 500,
    })
  }
  const price = median(prices)
  return {
    jobRunID: jobRunID,
    data: { result: price },
    result: price,
    statusCode: 200,
  }
}

export const execute: Execute = async (request) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || WRITE_MEDIAN_PRICE

  switch (endpoint) {
    case cryptocompare.NAME: {
      return executeCc(request, jobRunID)
    }

    case coingecko.NAME: {
      return executeCg(request, jobRunID)
    }

    case coinmarketcap.NAME: {
      return executeCmc(request, jobRunID)
    }

    case binance.NAME: {
      return executeBn(request, jobRunID)
    }

    case MEDIAN_PRICE: {
      return executeMedianPrice(request, jobRunID)
    }

    case WRITE_CC_PRICE: {
      return executeWriteCc(request, jobRunID)
    }

    case WRITE_CG_PRICE: {
      return executeWriteCg(request, jobRunID)
    }

    case WRITE_CMC_PRICE: {
      return executeWriteCmc(request, jobRunID)
    }

    case WRITE_BN_PRICE: {
      return executeWriteBn(request, jobRunID)
    }

    case WRITE_MEDIAN_PRICE: {
      return executeWriteMedianPrice(request, jobRunID)
    }

    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config?) => {
  return async (request) => execute(request)
}
