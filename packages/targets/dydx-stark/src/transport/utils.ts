import Decimal from 'decimal.js'
import { BigNumber, ethers } from 'ethers'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import * as starkwareCrypto from '@authereum/starkware-crypto'
import assert from 'assert'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('DyDxTransportUtils')

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

export const MAX_DECIMALS = 18

export const ZERO_BN = BigNumber.from('0')
export const TWO_BN = BigNumber.from('2')

export const powOfTwo = (num: number) => TWO_BN.pow(num)

export const ERROR_PRICE_NEGATIVE = 'Price must be a positive number.'
export const WARN_PRECISION_LOSS_NUMBER = 'Precision is lost. The number is very small or big.'

export const error400 = (message: string) => new AdapterInputError({ message, statusCode: 400 })

// Covert Decimal to max number of decimals, trim trailing zeros
export const toFixedMax = (num: Decimal, decimals: number): string => {
  return (
    new Decimal(num)
      .toFixed(decimals)
      // remove trailing zeros
      .replace(/(\.\d*?[1-9])0+$/g, '$1')
      // remove decimal part if all zeros (or only decimal point)
      .replace(/\.0*$/g, '')
  )
}

export const normalize = (num: number): Decimal => new Decimal(num).mul(10 ** MAX_DECIMALS)

export const tooMuchPrecision = (num: number): boolean =>
  toFixedMax(normalize(num), 1).indexOf('.') !== -1

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
 */
export const getPriceMessageRaw = (
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

  const w1 = first_number.toHexString().substring(2)
  const w2 = second_number.toHexString().substring(2)
  const hash = starkwareCrypto.hashMessage([w1, w2])

  return BigNumber.from('0x' + hash)
}

/**
 * Normalize price as string or throw on:
 *  - negative price
 *  - loss of precision
 *  - using more than available decimal points
 */
export const requireNormalizedPrice = (price: number): string => {
  // Check if negative number
  if (isNaN(price) || price < 0) {
    throw error400(`${ERROR_PRICE_NEGATIVE} Got: ${price}`)
  }

  // Check if there is any loss of precision
  // TODO: more precision loss detection with floats
  const overSafeValue = price > Number.MAX_SAFE_INTEGER
  if (overSafeValue || tooMuchPrecision(price)) {
    logger.warn(`${WARN_PRECISION_LOSS_NUMBER} Got: ${price}`)
  }

  return normalize(price).toFixed(0)
}

// Generate the STARK signed price data payload
export const getPricePayload = async (
  privateKey: string,
  starkMessage: string,
  data: PriceDataPoint,
): Promise<PriceStarkPayload> => {
  // 1-3. Generate STARK key pair
  const keyPair = await getKeyPair(privateKey, starkMessage)

  // 4. Hash the required parameters
  const message = getPriceMessage(data).toHexString().substring(2)

  // 5. Sign with your private stark key and the hash message to get r,s
  const { r, s } = starkwareCrypto.sign(keyPair, message)

  // 6. Generate the public key (pub_key) with your private key
  const starkPublicKey = starkwareCrypto.getStarkPublicKey(keyPair)

  // 7. Communicate (time, price, asset_name, r, s, pub_key) to dYdX
  return {
    ...data,
    signatureR: '0x' + r.toString(16),
    signatureS: '0x' + s.toString(16),
    starkKey: '0x' + starkPublicKey.substring(3),
  }
}

// Get STARK private key from an Ethereum pk and a constant message
export const getKeyPair = async (
  privateKey: string,
  starkMessage: string,
): Promise<starkwareCrypto.KeyPair> => {
  // 1. Generate Ethereum signature on a constant message
  const wallet = new ethers.Wallet(privateKey)
  const flatSig = await wallet.signMessage(starkMessage)

  // 2. Perform Keccak256 on the signature to get one 256-bit word
  const hash = ethers.utils.keccak256(flatSig)

  // 3. Cut the last 5 bits of it to get your 251-bit-long private stark key
  const pk = BigNumber.from(hash).shr(5).toHexString().substring(2)

  return starkwareCrypto.getKeyPair(pk)
}

// Apply pedersen hash on this price data point
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
