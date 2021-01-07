import objectPath from 'object-path'
import { ethers } from 'ethers'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config, DEFAULT_DATA_PATH } from '../config'

export const NAME = 'send'

const customParams = {
  dataPath: false,
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
      message: `Input, at '${dataPath}' path, must be a number.`,
      statusCode: 400,
    })

  // Get the current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000)

  // 1. Generate Ethereum signature on a constant message

  // Create a wallet to sign the message with
  const wallet = new ethers.Wallet(config.privateKey)
  const flatSig = await wallet.signMessage(config.starkMessage)

  // 2. Perform Keccak256 on the signature to get one 256-bit word
  const hash = ethers.utils.keccak256(flatSig)

  // 3. Cut the last 5 bits of it to get your 251-bit-long private stark key

  // 5. Sign with your private stark key and the hash message to get r,s
  const { r, s } = { r: '', s: '' }

  // 6. Generate the public key (pub_key) with your private key
  const pub_key = ''

  // 7. Communicate (time, price, asset_name, r, s, pub_key) to dYdX
  const params = {
    time: timestamp,
    price,
    asset_name: asset,
    r,
    s,
    pub_key,
  }

  const reqConfig = { ...config.api, params }

  const response = await Requester.request(reqConfig)
  return response.data
}
