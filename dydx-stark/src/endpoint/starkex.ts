import assert from 'assert'
import { ethers, BigNumber } from 'ethers'
import * as starkwareCrypto from '@authereum/starkware-crypto'
import { AdapterError } from '@chainlink/external-adapter'
import { Decimal } from 'decimal.js'
import { logger } from '@chainlink/external-adapter'

export type PriceDataPoint = {
  oracleName: string
  assetName: string
  timestamp: number
  price: string
}

export type PriceStarkPayload = PriceDataPoint & {
  starkKey: string
  signatureR: string
  signatureS: string
}

const MAX_DECIMALS = 18

const ZERO_BN = BigNumber.from('0')
const TWO_BN = BigNumber.from('2')

const powOfTwo = (num: number) => TWO_BN.pow(num)

const ERROR_MSG_PRICE_NEGATIVE = 'Price must be a positive number.'
const ERROR_MSG_PRICE_PRECISION_LOSS =
  'Please use string type to avoid precision loss with very small/big numbers.'

const error400 = (message: string) => new AdapterError({ message, statusCode: 400 })

/**
 * Normalize price as string or throw on:
 *  - negative price
 *  - loss of precision using number type
 *  - using more than available decimal points
 *
 * @param jobRunID job id reported on error
 * @param price price data point
 */
export const requireNormalizedPrice = (price: number | string): string => {
  // Check if negative number
  if (isNaN(Number(price)) || Number(price) < 0) {
    throw error400(`${ERROR_MSG_PRICE_NEGATIVE} Got: ${price}`)
  }

  // Check if there is any loss of precision
  const msg = `${ERROR_MSG_PRICE_PRECISION_LOSS} Got: ${price}.`
  if (typeof price === 'number') {
    // TODO: more precision loss detection with floats
    const overSafeValue = price > Number.MAX_SAFE_INTEGER
    if (overSafeValue) logger.warn(msg)
  }

  return new Decimal(price).mul(10 ** MAX_DECIMALS).toFixed(0)
}

/**
 * Generate the STARK signed price data payload
 *
 * @param privateKey Ethereum private key
 * @param starkMessage Constant message used to generate STARK pk
 * @param data price data point used to generate the payload
 */
export const getPricePayload = async (
  privateKey: string,
  starkMessage: string,
  data: PriceDataPoint,
): Promise<PriceStarkPayload> => {
  // 1-3. Generate STARK key pair
  const keyPair = await getKeyPair(privateKey, starkMessage)

  // 4. Hash the required parameters
  const message = getPriceMessage(data).toHexString().substr(2)

  // 5. Sign with your private stark key and the hash message to get r,s
  const { r, s } = starkwareCrypto.sign(keyPair, message)

  // 6. Generate the public key (pub_key) with your private key
  const starkPublicKey = starkwareCrypto.getStarkPublicKey(keyPair)

  // 7. Communicate (time, price, asset_name, r, s, pub_key) to dYdX
  return {
    ...data,
    signatureR: '0x' + r.toString(16),
    signatureS: '0x' + s.toString(16),
    starkKey: '0x' + starkPublicKey.substr(3),
  }
}

/**
 * Get STARK private key from a Ethereum pk and a constant message
 *
 * @param privateKey Ethereum private key
 * @param starkMessage Constant message used to generate STARK pk
 */
export const getKeyPair = async (
  privateKey: string,
  starkMessage: string,
): starkwareCrypto.KeyPair => {
  // 1. Generate Ethereum signature on a constant message
  const wallet = new ethers.Wallet(privateKey)
  const flatSig = await wallet.signMessage(starkMessage)

  // 2. Perform Keccak256 on the signature to get one 256-bit word
  const hash = ethers.utils.keccak256(flatSig)

  // 3. Cut the last 5 bits of it to get your 251-bit-long private stark key
  const pk = BigNumber.from(hash).shr(5).toHexString().substr(2)

  return starkwareCrypto.getKeyPair(pk)
}

/**
 * Apply pedersen hash on this price data point
 *
 * @param data price data point to hash
 */
export const getPriceMessage = (data: PriceDataPoint): BigNumber => {
  // padded to 40 bit
  const hexOracleName = '0x' + Buffer.from(data.oracleName).toString('hex').padEnd(10, '0')
  // padded to 128 bit
  const hexAssetName = '0x' + Buffer.from(data.assetName).toString('hex').padEnd(32, '0')

  return getPriceMessageRaw(
    BigNumber.from(hexOracleName),
    BigNumber.from(hexAssetName),
    BigNumber.from(data.timestamp),
    BigNumber.from(data.price),
  )
}

/**
 * Outputs a number which is less than FIELD_PRIME, which can be used as data
 * to sign on in the sign method. This number is obtained by applying pedersen
 * on the following two numbers:
 *
 *  first number:
 * # --------------------------------------------------------------------------------- #
 * # | 0 (84 bits)      | asset_name (128 bits)         |   oracleName (40 bits)     | #
 * # --------------------------------------------------------------------------------- #
 *
 *  second number:
 * # --------------------------------------------------------------------------------- #
 * # | 0 (100 bits)         | price (120 bits)             |   timestamp (32 bits)   | #
 * # --------------------------------------------------------------------------------- #
 *
 * @param oracleName a 40-bit number, describes the oracle (i.e hex encoding of "Maker")
 * @param assetName a 128-bit number
 * @param timestamp a 32 bit number, represents seconds since epoch
 * @param price a 120-bit number
 */
const getPriceMessageRaw = (
  oracleName: BigNumber,
  assetName: BigNumber,
  timestamp: BigNumber,
  price: BigNumber,
): BigNumber => {
  assert(oracleName.gte(ZERO_BN), error400('oracleName must be >= 0'))
  assert(oracleName.lt(powOfTwo(40)), error400('oracleName must be < 2 ** 40'))

  assert(assetName.gte(ZERO_BN), error400('assetName must be >= 0'))
  assert(assetName.lt(powOfTwo(128)), error400('assetName must be < 2 ** 128'))

  assert(timestamp.gte(ZERO_BN), error400('timestamp must be >= 0'))
  assert(timestamp.lt(powOfTwo(32)), error400('timestamp must be < 2 ** 32'))

  assert(price.gte(ZERO_BN), error400('price must be >= 0'))
  assert(price.lt(powOfTwo(120)), error400('price must be < 2 ** 120'))

  // The first number to hash is the oracle name (Maker) and the asset name.
  const first_number = assetName.shl(40).add(oracleName)

  // The second number is timestamp in the 32 LSB, then the price.
  const second_number = price.shl(32).add(timestamp)

  const w1 = first_number.toHexString().substr(2)
  const w2 = second_number.toHexString().substr(2)
  const hash = starkwareCrypto.hashMessage([w1, w2])

  return BigNumber.from('0x' + hash)
}
