import { PriceUpdateParams } from 'dock/types'

require('dotenv').config()

const { MinGasPrice, MaxGas } = process.env

export const median = (numbers: number[]): number => {
  let mid: number
  const numsLen = numbers.length
  numbers.sort()

  if (numsLen % 2 === 0) {
    // is even
    // average of two middle numbers
    mid = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2
  } else {
    // is odd
    // middle number only
    mid = numbers[(numsLen - 1) / 2]
  }
  return mid
}

export const timestampSecs = (): number => {
  return Math.round(Date.now() / 1000)
}

// If PriceUpdateParams indicate an update
export const isPotentialPriceUpdate = (priceUpdate: PriceUpdateParams): boolean => {
  return priceUpdate.forceWrite || priceUpdate.idleTime === 0 || priceUpdate.thresholdPct === 0
}

export const priceUpdateNeeded = (
  currentPrice: number,
  latestRoundData: { updatedAt: number; answer: number },
  priceUpdate: PriceUpdateParams,
): boolean => {
  console.log(priceUpdate)
  const timestamp = timestampSecs() // timestamp in seconds as the contract stores price update timestamp in seconds
  if (timestamp - latestRoundData.updatedAt < priceUpdate.idleTime) {
    // The aggregator contract only tracks timestamp but if its made to track the block number then this code can query current block number and then compare.
    const priceDiffAbs = Math.abs(currentPrice - latestRoundData.answer)
    if ((priceDiffAbs / latestRoundData.answer) * 100 < priceUpdate.thresholdPct) {
      return false
    }
  }
  return true
}

export const writePriceToChain = async (
  web3: any,
  aggrAddr: string,
  aggrABI: object,
  oracleAddr: string,
  signer: any,
  priceUpdate: PriceUpdateParams,
): Promise<number | undefined> => {
  const aggrContract = new web3.eth.Contract(aggrABI, aggrAddr)
  const oracleState = await aggrContract.methods.oracleRoundState(oracleAddr, 0).call()
  if (!oracleState._eligibleToSubmit) {
    throw new Error('Not eligible to submit price.')
  }

  // To make it integer
  const normalizedPrice = Math.round(priceUpdate.currentPrice * 1000)

  // Check if price should not be updated because either the price isn't stale ago or the current price has not deviated enough from the on-chain price
  if (!isPotentialPriceUpdate(priceUpdate)) {
    const latestRoundData = await aggrContract.methods.latestRoundData().call()
    if (!priceUpdateNeeded(normalizedPrice, latestRoundData, priceUpdate)) {
      console.log('Not updating price')
      return
    }
  }

  console.log(`Updating on chain price to ${priceUpdate.currentPrice}`)
  const nextRoundId = oracleState._roundId
  const encoded = aggrContract.methods.submit(nextRoundId, normalizedPrice).encodeABI()

  const txn = await signer.signTransaction({
    to: aggrAddr,
    data: encoded,
    value: web3.utils.toBN(0),
    gasPrice: web3.utils.toBN(MinGasPrice), // Hardcoding gas price as its fixed in the node
    gas: web3.utils.toBN(MaxGas),
  })

  const txnReceipt = await web3.eth.sendSignedTransaction(txn.rawTransaction)
  return txnReceipt.blockNumber // Not returning block hash as its not reliable
}
