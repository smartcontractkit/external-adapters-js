import { Requester, Validator, AdapterError, InputParameters, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { Config } from '../config'

export const NAME = 'txsend'

const encode = (type: string, value: string | number) => {
  let retVal
  switch (type) {
    case 'bytes32':
      retVal = ethers.utils.formatBytes32String(value as string)
      break
    default:
      retVal = ethers.utils.defaultAbiCoder.encode([type], [value])
      break
  }
  return retVal.slice(2)
}
export type TInputParameters = {
  exAddr: string
  funcId: string
  dataType: string
  result: string | number
  dataToSend: string | number
}
export const customParams: InputParameters<TInputParameters> = {
  exAddr: {
    description: 'The address for sending the transaction to',
    type: 'string',
    required: true,
  },
  funcId: {
    description: 'The setter function to call',
    type: 'string',
    required: false,
  },
  dataType: {
    description:
      'Pass this only in case you need to encode the data(normally should be already encoded)',
    type: 'string',
    required: false,
  },
  result: {
    description: 'The result of the previous adapter',
    required: false,
  },
  dataToSend: {
    description: 'If specified, this value will be sent instead of `result`',
    required: false,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.privateKey, provider)

  const validator = new Validator(request, customParams)

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
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
      statusCode: 400,
    })
  }
}
