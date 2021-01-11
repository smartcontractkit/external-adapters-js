import assert from 'assert'
import BN from 'bn.js'
import { ethers } from 'ethers'
import * as starkwareCrypto from '@authereum/starkware-crypto'
import { AdapterError } from '@chainlink/external-adapter'

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

const ZERO_BN = new BN('0')
const TWO_BN = new BN('2')
const TEN_BN = new BN('10')

const powOfTwo = (num: number) => TWO_BN.pow(new BN(num))
const powOfTen = (num: number) => TEN_BN.pow(new BN(num))

export const requireNormalizedPrice = (jobRunID: string, price: number | string): string => {
  // Check if positive number
  if (isNaN(Number(price)) || Number(price) < 0) {
    throw new AdapterError({
      jobRunID,
      message: `Price must be a positive number. Got: ${price}`,
      statusCode: 400,
    })
  }

  // Check if there is any loss of precision
  if (typeof price === 'number') {
    const isDecimal = !Number.isInteger(price as number)
    const decimalValue = price - Math.floor(price)
    if (
      price > Number.MAX_SAFE_INTEGER ||
      (isDecimal && price > Number.MAX_SAFE_INTEGER / 100) ||
      (decimalValue > 0 && decimalValue < 1e-18)
    ) {
      throw new AdapterError({
        jobRunID,
        message: `Please use string type to avoid precision loss with very small/big numbers. Got: ${price}.`,
        statusCode: 400,
      })
    }
  }

  // Convert number to decimal string (no scientific notation)
  const _toString = (n: number) => {
    const nStr = n.toString()
    if (nStr.indexOf('e') === -1) return nStr
    return (
      n
        .toFixed(MAX_DECIMALS)
        // remove trailing zeros
        .replace(/(\.\d*?[1-9])0+$/g, '$1')
    )
  }

  const priceStr = typeof price === 'number' ? _toString(price as number) : (price as string)
  const priceStrParts = priceStr.split('.')
  const priceBig = new BN(priceStrParts[0]).mul(powOfTen(MAX_DECIMALS))
  const decimals = (priceStrParts[1] && priceStrParts[1].length) || 0

  if (decimals === 0) return priceBig.toString()
  // Check if too many decimals
  if (decimals > MAX_DECIMALS) {
    throw new AdapterError({
      jobRunID,
      message: `Price has too many decimals. Got: ${decimals}; Max: ${MAX_DECIMALS}`,
      statusCode: 400,
    })
  }

  const bigDecimals = new BN(priceStrParts[1]).mul(powOfTen(MAX_DECIMALS - decimals))
  return priceBig.add(bigDecimals).toString()
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
  const message = getPriceMessage(data)

  // 5. Sign with your private stark key and the hash message to get r,s
  const { r, s } = starkwareCrypto.sign(keyPair, message.toString(16))

  // 6. Generate the public key (pub_key) with your private key
  const starkPublicKey = starkwareCrypto.getStarkPublicKey(keyPair)

  // 7. Communicate (time, price, asset_name, r, s, pub_key) to dYdX
  return {
    ...data,
    signatureR: r.toString(16),
    signatureS: s.toString(16),
    starkKey: starkPublicKey,
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
  const pk = new BN(hash.substr(2), 16).shrn(5).toString(16)

  return starkwareCrypto.getKeyPair(pk)
}

/**
 * Apply pedersen hash on this price data point
 *
 * @param data price data point to hash
 */
export const getPriceMessage = (data: PriceDataPoint): BN => {
  return getPriceMessageRaw(
    new BN(Buffer.from(data.oracleName).toString('hex'), 16),
    new BN(Buffer.from(data.assetName).toString('hex'), 16),
    new BN(data.timestamp),
    new BN(data.price),
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
const getPriceMessageRaw = (oracleName: BN, assetName: BN, timestamp: BN, price: BN): BN => {
  assert(oracleName.gte(ZERO_BN), 'oracleName must be >= 0')
  assert(oracleName.lt(powOfTwo(40)), 'oracleName must be < 2 ** 40')

  assert(assetName.gte(ZERO_BN), 'assetName must be >= 0')
  assert(assetName.lt(powOfTwo(128)), 'assetName must be < 2 ** 128')

  assert(timestamp.gte(ZERO_BN), 'timestamp must be >= 0')
  assert(timestamp.lt(powOfTwo(32)), 'timestamp must be < 2 ** 32')

  assert(price.gte(ZERO_BN), 'price must be >= 0')
  assert(price.lt(powOfTwo(120)), 'price must be < 2 ** 120')

  // The first number to hash is the oracle name (Maker) and the asset name.
  const first_number = assetName.shln(40).add(oracleName)

  // The second number is timestamp in the 32 LSB, then the price.
  const second_number = price.shln(32).add(timestamp)

  const w1 = first_number.toString(16)
  const w2 = second_number.toString(16)
  const hash = starkwareCrypto.hashMessage([w1, w2])
  return new BN(hash, 16)
}
