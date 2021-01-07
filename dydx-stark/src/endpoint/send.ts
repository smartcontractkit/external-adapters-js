import BN from 'bn.js'
import objectPath from 'object-path'
import { ethers } from 'ethers'
import * as starkwareCrypto from '@authereum/starkware-crypto'
import { ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator, AdapterError, logger } from '@chainlink/external-adapter'
import { Config, DEFAULT_DATA_PATH } from '../config'
import { getPriceMessage } from './starkex_messages'

export const NAME = 'send'

const customParams = {
  dataPath: false,
  result: false,
  asset: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { asset, ...data } = validator.validated.data

  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const price = <number>objectPath.get(data, dataPath)
  // Check if input data is valid
  if (isNaN(price))
    throw new AdapterError({
      jobRunID,
      message: `Input, at '${dataPath}' path, must be a number. Got: ${price}`,
      statusCode: 400,
    })

  // 1. Generate Ethereum signature on a constant message
  const wallet = new ethers.Wallet(config.privateKey)
  const flatSig = await wallet.signMessage(config.starkMessage)

  // 2. Perform Keccak256 on the signature to get one 256-bit word
  const hash = ethers.utils.keccak256(flatSig)

  // 3. Cut the last 5 bits of it to get your 251-bit-long private stark key
  const pk = new BN(hash).shrn(5).toString(16)
  const keyPair = starkwareCrypto.getKeyPair(pk)

  // 4. Hash the required parameters
  // Get the current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000)
  const message = getPriceMessage(
    new BN(config.oracleName, 16),
    new BN(asset, 16),
    new BN(timestamp),
    new BN(price),
  )

  // 5. Sign with your private stark key and the hash message to get r,s
  const { r, s } = starkwareCrypto.sign(keyPair, message.toString(16))

  // 6. Generate the public key (pub_key) with your private key
  const starkPublicKey = starkwareCrypto.getStarkPublicKey(keyPair)

  // 7. Communicate (time, price, asset_name, r, s, pub_key) to dYdX
  const payload = {
    time: timestamp,
    price,
    asset_name: asset,
    r,
    s,
    pub_key: starkPublicKey,
  }

  logger.debug('Sending payload: ', { payload })

  const options = {
    ...config.api,
    url: '',
    method: 'POST',
    data: payload,
  }

  const response = await Requester.request(options)
  const result = response.data

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
