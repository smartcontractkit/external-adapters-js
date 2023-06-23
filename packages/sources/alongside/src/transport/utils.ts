import { ethers } from 'ethers'
import { bignumber, number } from 'mathjs'
import axios from 'axios'
import abi from '../config/abi.json'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { BalanceType } from './collateral'
import CryptoJS from 'crypto-js'

const logger = makeLogger('Alongside  collateral calculation logger')

export const sign = (str: string, secret: string) => {
  const hash = CryptoJS.HmacSHA256(str, secret)
  return hash.toString(CryptoJS.enc.Base64)
}

export class Collateral {
  provider: ethers.providers.JsonRpcProvider
  IndexToken: ethers.Contract
  constructor(rpcUrl: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    this.IndexToken = new ethers.Contract(
      '0xF17A3fE536F8F7847F1385ec1bC967b2Ca9caE8D',
      abi,
      this.provider,
    )
  }

  getAssetWeights = async () => {
    const input = await this.getAssetWeightsInput()
    return this.calcAssetWeights(
      input.feeWhenMethodologySet,
      input.feeChanges,
      input.from,
      input.to,
      input.initialMethodology,
    )
  }

  getAssetWeightsInput = async () => {
    logger.debug('Getting asset weights input')
    const indexToken = this.IndexToken
    const from = await this.getLatestMethodologySetInfo(indexToken)
    const latestBlock = await this.provider.getBlock('latest')
    const to = {
      timestamp: latestBlock.timestamp,
      blockNumber: latestBlock.number,
    }

    // fee at the time the methodology was set
    const feeWhenMethodologySet =
      (await indexToken.feeRatePerDayScaled({
        blockTag: from.blockNumber,
      })) / Math.pow(10, 20)

    // get all intervening fee changes
    const feeChanges = await this.getFeeChanges(indexToken, from.blockNumber, to.blockNumber)
    logger.debug('Fetching methodology')
    const initialMethodology = await this.fetchMethodology()
    return {
      feeWhenMethodologySet,
      feeChanges,
      from,
      to,
      initialMethodology,
    }
  }

  calcAssetWeights = (
    feeWhenMethodologySet: number,
    feeChanges: any,
    from: { blockNumber?: number; timestamp: number },
    to: { timestamp: number; blockNumber?: number },
    initialMethodology: { [s: string]: unknown } | ArrayLike<unknown>,
  ) => {
    logger.debug('Calculating asset weights')
    const intervals = [
      ...feeChanges,
      // and add the timestamp of the last mint/redeem
      [to.timestamp, NaN],
    ]

    const inflation = this.calcMultiRateInflation(from.timestamp, feeWhenMethodologySet, intervals)

    return Object.fromEntries(
      Object.entries(initialMethodology).map(([symbol, weight]) => [
        symbol,
        (weight as number) * inflation,
      ]),
    )
  }

  calcMultiRateInflation = (
    startTimestamp: number,
    startFee: number,
    intervals: Iterable<number[]>,
  ) => {
    logger.debug('Calculating multi rate inflation')
    let inflation = 1
    let lastTimestamp = startTimestamp
    let lastFeeRate = startFee
    for (const [timestamp, feeRate] of intervals) {
      inflation *= this.calcInflation(lastFeeRate, lastTimestamp, timestamp)
      lastFeeRate = feeRate
      lastTimestamp = timestamp
    }
    return inflation
  }

  calcInflation = (feeRate: number, fromTimestamp: number, toTimestamp: number) => {
    logger.debug('Calculating inflation')
    const bigNumResult = bignumber(1)
      .div(bignumber(1).plus(feeRate))
      .pow(
        bignumber(toTimestamp)
          .sub(bignumber(fromTimestamp))
          .div(60 * 60 * 24),
      )
    return number(bigNumResult)
  }

  getLatestMethodologySetInfo = async (indexToken: ethers.Contract) => {
    logger.debug('Getting latest methodology info')
    const latestBlock = await this.provider.getBlock('latest')
    const logs = await this.provider.getLogs({
      ...indexToken.filters.MethodologySet(),
      fromBlock: latestBlock.number - 300_000,
      toBlock: latestBlock.number,
    })
    // TODO replace me with an assert
    if (logs.length === 0) {
      throw new Error("shouldn't happen")
    }
    const blockNumber = logs[logs.length - 1].blockNumber
    return await this.withTimestamp(blockNumber)
  }

  getFeeChanges = async (indexToken: ethers.Contract, fromBlock: number, toBlock: number) => {
    logger.debug('Getting fee changes')
    return await Promise.all(
      (
        await this.provider.getLogs({
          ...indexToken.filters.FeeRateSet(),
          // TODO test that this won't mess up when they're the same number
          // TODO test we exclude the fee change when
          // it's _before_ the methodology set in the same block
          fromBlock,
          toBlock,
        })
      ).map(async (feeChange) => [
        await this.getTimestamp(feeChange.blockNumber),
        parseInt(feeChange.topics[1]) / Math.pow(10, 20),
      ]),
    )
  }

  getTimestamp = async (blockNumber: number) =>
    (await this.provider.getBlock(blockNumber)).timestamp

  withTimestamp = async (blockNumber: number) => ({
    blockNumber,
    timestamp: await this.getTimestamp(blockNumber),
  })

  fetchMethodology = async () =>
    (
      await this.fetchIPFS(
        await this.IndexToken.methodology({
          blockTag: (await this.provider.getBlock('latest')).number,
        }),
        false,
      )
    ).assets

  fetchIPFS = async (path: string, pinataFirst = true) => {
    try {
      if (pinataFirst) {
        const data = await this.fetchIPFSFromPinata(path)
        return data
      } else {
        const data = await this.fetchIPFSFromInfura(path)
        return data
      }
    } catch (error) {
      logger.error(
        `failed to fetch from ${pinataFirst ? 'Pinata' : 'Infura'}, trying ${
          pinataFirst ? 'Infura' : 'Pinata'
        }"}`,
      )
      if (pinataFirst) {
        const data = await this.fetchIPFSFromInfura(path)
        return data
      } else {
        const data = await this.fetchIPFSFromPinata(path)
        return data
      }
    }
  }

  calcMinCollateral = (
    tradingBalances: BalanceType[],
    vaultBalances: BalanceType[],
    units: { [x: string]: number },
  ): number => {
    logger.warn({
      tradingBalances,
      vaultBalances,
      units,
    })
    let min = Number.MAX_SAFE_INTEGER
    const balances: { [key: string]: number } = {}
    for (const key of Object.keys(units)) {
      for (let i = 0; i < tradingBalances.length; i++) {
        if (tradingBalances[i].symbol.toUpperCase() === key) {
          balances[key] = tradingBalances[i].amount / units[key]
        }
      }
      for (let i = 0; i < vaultBalances.length; i++) {
        if (vaultBalances[i].symbol.toUpperCase() === key) {
          if (Object.keys(balances).includes(key)) {
            balances[key] += vaultBalances[i].amount / units[key]
          } else {
            balances[key] = vaultBalances[i].amount / units[key]
          }
        }
      }
    }
    if (Object.keys(balances).sort().join(',') !== Object.keys(units).sort().join(',')) {
      throw 'Balances not found for all units'
    }
    for (const key of Object.keys(balances)) {
      if (balances[key] < min) {
        min = balances[key]
      }
    }
    return min
  }

  fetchIPFSFromPinata = async (path: string) => {
    logger.debug('Fetching IPFS from Pinata')
    const newPath = path.replace('ipfs://', '')
    const baseURL = 'dxas'
    const ipfsUrl = `${baseURL}/${newPath}`
    const res = await axios.get(ipfsUrl, {
      headers: {
        Accept: 'Accept: text/plain',
      },
    })
    return res?.data
  }

  fetchIPFSFromInfura = async (path: string) => {
    logger.debug('Fetching IPFS from Infura')
    const newPath = path.replace('ipfs://', '')
    const baseURL = 'https://amkt.infura-ipfs.io/ipfs'
    const ipfsUrl = `${baseURL}/${newPath}`

    const res = await axios.get(ipfsUrl, {
      headers: {
        Accept: 'Accept: text/plain',
      },
    })
    return res?.data
  }
}
