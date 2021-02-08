import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { ethers } from 'ethers'
import { DEFAULT_PRIVATE_KEY, DEFAULT_RPC_URL } from '../config'

export const NAME = 'txsend'

const provider = new ethers.providers.JsonRpcProvider(process.env.URL || DEFAULT_RPC_URL)
const privateKey = process.env.PRIVATE_KEY || DEFAULT_PRIVATE_KEY

const wallet = new ethers.Wallet(privateKey, provider)

const encode = (type: any, value: any) => {
  let retVal
  switch (type) {
    case 'bytes32':
      retVal = ethers.utils.formatBytes32String(value)
      break
    default:
      retVal = ethers.utils.defaultAbiCoder.encode([type], [value])
      break
  }
  return retVal.slice(2)
}

const customParams = {
  exAddr: false,
  funcId: false,
  dataType: false,
  result: false,
  dataToSend: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const externalAddress = validator.validated.data.exAddr || ''
  const functionId = validator.validated.data.funcId || ''
  const dataType = validator.validated.data.dataType || 'uint256'
  // Prioritize data coming from a previous adapter (result),
  // but allow dataToSend to be used if specified
  const dataToSend = validator.validated.data.result || validator.validated.data.dataToSend || ''
  // Ensure we use only 4 bytes for the functionId
  const transactionData = functionId.substring(0, 10) + encode(dataType, dataToSend)

  const transaction = {
    to: externalAddress,
    data: transactionData,
  }

  try {
    const tx = await wallet.sendTransaction(transaction)
    return Requester.success(jobRunID, {
      data: tx,
      status: 200,
    })
  } catch (e) {
    throw new AdapterError({
      jobRunID,
      message: e,
      statusCode: 400,
    })
  }
}
