import { InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/ea-bootstrap'
import { Harmony } from '@harmony-js/core'
import { getAddress, hexToByteArray, hexlify, concat } from '@harmony-js/crypto'
import { ChainType } from '@harmony-js/utils'
import { Config, makeConfig, DEFAULT_API_ENDPOINT } from './config'

export type TInputParameters = {
  address: string
  functionSelector: string
  dataPrefix: string
  dataToSend: string
}
export const inputParams: InputParameters<TInputParameters> = {
  address: {
    description: 'the oracle contract to fulfill the request on',
    type: 'string',
    required: true,
  },
  functionSelector: {
    description: 'the fulfillment function selector',
    type: 'string',
    required: true,
  },
  dataPrefix: {
    description: 'the data prefix in the request',
    type: 'string',
    required: false,
  },
  dataToSend: {
    aliases: ['result'],
    description: 'the value to fulfill the request with',
    type: 'string',
    required: false,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const functionSelector = validator.validated.data.functionSelector
  const dataPrefix = validator.validated.data.dataPrefix || ''
  const dataToSend = validator.validated.data.dataToSend || ''

  const transactionData = hexlify(
    concat([
      hexToByteArray(functionSelector),
      hexToByteArray(dataPrefix),
      hexToByteArray(dataToSend),
    ]),
  )

  const url = config.api?.baseURL || DEFAULT_API_ENDPOINT
  const hmy = new Harmony(url, {
    chainType: ChainType.Harmony,
    chainId: Number(config.chainID),
  })

  const transaction = hmy.transactions.newTx({
    to: getAddress(address).checksum,
    data: transactionData,
    gasLimit: config.gasLimit,
    gasPrice: new hmy.utils.Unit('1').asGwei().toWei(),
  })

  hmy.wallet.addByPrivateKey(config.privateKey)
  const signedTxn = await hmy.wallet.signTransaction(transaction)
  const result = await hmy.blockchain.sendTransaction(signedTxn)
  const txHash = Requester.validateResultNumber(result, ['result'])

  return Requester.success(jobRunID, {
    data: { txHash },
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
