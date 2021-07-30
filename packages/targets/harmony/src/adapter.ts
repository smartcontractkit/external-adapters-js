import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { Harmony } from '@harmony-js/core'
import { getAddress, hexToByteArray, hexlify, concat } from '@harmony-js/crypto'
import { ChainType } from '@harmony-js/utils'
import { Config, makeConfig, DEFAULT_API_ENDPOINT } from './config'

const inputParams = {
  address: ['address'],
  functionSelector: ['functionSelector'],
  dataPrefix: false,
  dataToSend: ['dataToSend', 'result'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

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

  const url = config.api.baseURL || DEFAULT_API_ENDPOINT
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

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
