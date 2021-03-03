import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { logger } from '@chainlink/external-adapter'
import { CustomConfig, makeConfig } from './config'
import fs from 'fs'
import Caver from 'caver-js'

const makeTx = async (caver: any, keyring: any, input: any): Promise<txResult> => {
  let { address, data, topics, value } = input
  value = JSON.parse(value).result

  // decode data in log
  const decoded = caver.abi.decodeLog(
    JSON.parse(fs.readFileSync('./OracleRequestABI.json').toString()),
    data,
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
  return new caver.transaction.legacyTransaction({
    from: keyring.toAccount()._address,
    to: address,
    input: functionSelector.concat(params),
    gas: 1500000,
  })
}

const customParams = {
  address: ['address'],
  data: ['data'],
  topics: ['topics'],
  value: ['result', 'value'],
}

export const execute: ExecuteWithConfig<CustomConfig> = async (request, config) => {
  Requester.logConfig(config)

  const caver = new Caver(config.url)
  const keyring = caver.wallet.keyring.createFromPrivateKey(config.apiKey)
  caver.wallet.add(keyring)

  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  try {
    const tx = await makeTx(caver, keyring, validator.validated)
    const response = await caver.wallet
      .sign(keyring.address, tx)
      .then(caver.rpc.klay.sendRawTransaction)
    const result = response.transactionHash

    return Requester.success(jobRunID, {
      data: config.verbose ? { ...response, result } : { result },
      result,
      status: 200,
    })
  } catch (e) {
    return Requester.errored(jobRunID, e)
  }
}

export const makeExecute: ExecuteFactory<CustomConfig> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
