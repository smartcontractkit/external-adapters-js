import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { logger } from '@chainlink/external-adapter'
import { Config, makeConfig } from './config'
import { txResult } from './types'
import fs from 'fs'
const Caver = require('caver-js')

const sendFulfillment = async (
  caver: any,
  keyring: any,
  address: string,
  logData: string,
  topics: string,
  value: string,
) => {
  // decode data in log
  const decoded = caver.abi.decodeLog(
    JSON.parse(fs.readFileSync('./OracleRequestABI.json').toString()),
    logData,
    topics,
  )

  logger.debug('[Decoded Data]: ', { decoded })

  // get function selector
  const functionSelector = caver.abi.encodeFunctionSignature(
    'fulfillOracleRequest(bytes32,uint256,address,bytes4,uint256,bytes32)',
  )

  // convert value to hex
  if (!isNaN(+value)) {
    // if number
    value = caver.utils.numberToHex(value)
  } else if (value.substring(0, 2) != '0x') {
    // if string
    value = caver.utils.stringToHex(value)
  }

  // encode params
  const params = caver.abi
    .encodeParameters(
      ['bytes32', 'uint256', 'address', 'bytes4', 'uint256', 'bytes32'],
      [
        decoded.requestId,
        decoded.payment,
        decoded.callbackAddr,
        decoded.callbackFunctionId,
        decoded.cancelExpiration,
        caver.utils.leftPad(value, 64),
      ],
    )
    .substring(2)

  // make transaction
  const tx = new caver.transaction.legacyTransaction({
    from: keyring.toAccount()._address,
    to: address,
    input: functionSelector.concat(params),
    gas: 1500000,
  })

  return await caver.wallet.sign(keyring.address, tx).then(caver.rpc.klay.sendRawTransaction)
}

const customParams = {
  address: ['address'],
  data: ['data'],
  topics: ['topics'],
  value: ['result', 'value'],
}

export const execute = async (request: AdapterRequest, config: Config) => {
  const caver = new Caver(config.url)
  const keyring = caver.wallet.keyring.createFromPrivateKey(config.privatekey)
  caver.wallet.add(keyring)

  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const data = validator.validated.data.data
  const topics = validator.validated.data.topics
  const value = validator.validated.data.value

  try {
    const tx: txResult = await sendFulfillment(
      caver,
      keyring,
      address,
      data,
      topics,
      JSON.parse(value).result,
    )

    return Requester.success(jobRunID, {
      data: { result: tx.transactionHash },
      result_tx: tx.transactionHash,
      status: 200,
    })
  } catch (e) {
    return Requester.errored(jobRunID, e)
  }
}

export const makeExecute = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
