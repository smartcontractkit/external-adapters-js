import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { ethers } from 'ethers'
import { Config } from '../config'

export const NAME = 'txsend'

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
  exAddr: true,
  funcId: false,
  dataType: false,
  result: false,
  dataToSend: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.privateKey, provider)

  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const getUint256 = '0xc2b12a73'

  const jobRunID = validator.validated.id
  const externalAddress = validator.validated.data.exAddr
  const functionId = validator.validated.data.funcId || getUint256
  // Passing this optionally, in case the data is not encrypted from the previous step
  const dataType = validator.validated.data.dataType
  // Prioritize data coming from a previous adapter (result),
  // but allow dataToSend to be used if specified
  const dataToSend = validator.validated.data.result || validator.validated.data.dataToSend || ''
  // Ensure we use only 4 bytes for the functionId
  let transactionData
  if (dataType) {
    transactionData = functionId.substring(0, 10) + encode(dataType, dataToSend)
  } else {
    transactionData = functionId.substring(0, 10) + dataToSend
  }

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
