import { Logger } from '@chainlink/ea-bootstrap'
import { ByteArray } from '@ethercards/ec-util'
import { ethers } from 'ethers'
import { ZERO_ADDRESS } from './config'
import { ProcessedEventInfo } from './types'

export const callToRequestData = (
  calls: string[][],
  dataRecordID: number,
  lastDate: string,
  remainingData = false,
): string => {
  let bytes = ''
  const header = new ByteArray(Buffer.alloc(7))
  header.writeUnsignedShort(calls.length)
  header.writeUnsignedInt(dataRecordID)
  header.writeBoolean(remainingData)
  bytes = header.toString('hex')
  bytes += removeZeroX(ethers.utils.formatBytes32String(lastDate))
  for (let i = 0; i < calls.length; i++) {
    const callLen = callLentoHex(removeZeroX(calls[i][1]).length)
    const address = addresstoCallData(calls[i][0])
    const callData = removeZeroX(calls[i][1])
    const packet = callLen + address + callData
    bytes += packet
  }

  return bytes
}

const removeZeroX = (str: string): string => {
  return str.replace('0x', '')
}

const addresstoCallData = (str: string): string => {
  return '000000000000000000000000' + removeZeroX(str)
}

const callLentoHex = (num: number): string => {
  const data = new ByteArray(Buffer.alloc(2))
  data.writeUnsignedShort(num / 2)
  return removeZeroX(data.toString('hex'))
}

export const updateEncodedCalls = async (
  jobRunID: string,
  achievementID: number,
  calls: string[][],
  batchWriter: ethers.Contract,
  eventID: number,
  date: string,
  procesedEventIDs: ProcessedEventInfo[],
): Promise<{
  hasHitLimit: boolean
  encodedCalls: string
}> => {
  const gasEstimation = await estimateCallsGasCost(
    jobRunID,
    achievementID,
    calls,
    batchWriter,
    eventID,
    date,
  )
  let encodedCalls = gasEstimation.encodedCalls
  if (gasEstimation.hasHitLimit) {
    encodedCalls = await handleWhenCallsNeedsMoreProcessing(
      jobRunID,
      calls,
      batchWriter,
      date,
      procesedEventIDs,
    )
  }
  return {
    encodedCalls,
    hasHitLimit: gasEstimation.hasHitLimit,
  }
}

export const handleWhenCallsNeedsMoreProcessing = async (
  jobRunID: string,
  calls: string[][],
  batchWriter: ethers.Contract,
  date: string,
  procesedEventIDs: ProcessedEventInfo[],
): Promise<string> => {
  let isOverGasLimit = true
  let encodedCalls = ''
  while (isOverGasLimit) {
    calls.pop()
    procesedEventIDs.pop()
    const lastProcessedEvent = procesedEventIDs[procesedEventIDs.length - 1]
    const needsMoreProcessingCall = calls.concat([
      batchWriter.address,
      batchWriter.interface.encodeFunctionData('requestBytes', []),
    ])
    const newEncodedCallsResult = await estimateCallsGasCost(
      jobRunID,
      lastProcessedEvent.achievementID,
      needsMoreProcessingCall,
      batchWriter,
      lastProcessedEvent.eventID,
      date,
      true,
    )
    isOverGasLimit = newEncodedCallsResult.hasHitLimit
    encodedCalls = newEncodedCallsResult.encodedCalls
  }
  return encodedCalls
}

export const estimateCallsGasCost = async (
  jobRunID: string,
  achievementID: number,
  calls: string[][],
  batchWriter: ethers.Contract,
  eventID: number,
  date: string,
  needsMoreProcesing = false,
): Promise<{
  hasHitLimit: boolean
  encodedCalls: string
}> => {
  let hasHitLimit = false
  const encodedCalls = callToRequestData(calls, eventID, date, needsMoreProcesing)
  try {
    const gasCostEstimate = await batchWriter.estimateGas.estimate(
      ethers.utils.formatBytes32String(jobRunID),
      `0x${encodedCalls}`,
      {
        from: ZERO_ADDRESS,
      },
    )
    Logger.info(
      `Successfully estimated gas ${gasCostEstimate.toString()} for processing achievementID ${achievementID} and eventID ${eventID}`,
    )
  } catch (e: any) {
    hasHitLimit = true
  }
  return {
    encodedCalls,
    hasHitLimit,
  }
}
