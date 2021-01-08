import assert from 'assert'
import BN from 'bn.js'
import { ethers } from 'ethers'
import * as starkwareCrypto from '@authereum/starkware-crypto'

export type PriceDataPoint = {
  oracleName: string
  assetPair: string
  timestamp: number
  price: BN
}

export type PriceStarkPayload = {
  time: number
  price: string
  asset_name: string
  r: string
  s: string
  pub_key: string
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
    time: data.timestamp,
    price: data.price.toString(10),
    asset_name: data.assetPair,
    r: r.toString(16),
    s: s.toString(16),
    pub_key: starkPublicKey,
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
  const pk = new BN(hash).shrn(5).toString(16)

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
    new BN(Buffer.from(data.assetPair).toString('hex'), 16),
    new BN(data.timestamp),
    data.price,
  )
}

const ZERO_BN = new BN('0')
const TWO_BN = new BN('2')

const powOfTwo = (num: number) => TWO_BN.pow(new BN(num))

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
 * @param assetPair a 128-bit number
 * @param timestamp a 32 bit number, represents seconds since epoch
 * @param price a 120-bit number
 */
const getPriceMessageRaw = (oracleName: BN, assetPair: BN, timestamp: BN, price: BN): BN => {
  assert(oracleName.gte(ZERO_BN), 'oracleName must be >= 0')
  assert(oracleName.lt(powOfTwo(40)), 'oracleName must be < 2 ** 40')

  assert(assetPair.gte(ZERO_BN), 'assetPair must be >= 0')
  assert(assetPair.lt(powOfTwo(128)), 'assetPair must be < 2 ** 128')

  assert(timestamp.gte(ZERO_BN), 'timestamp must be >= 0')
  assert(timestamp.lt(powOfTwo(32)), 'timestamp must be < 2 ** 32')

  assert(price.gte(ZERO_BN), 'price must be >= 0')
  assert(price.lt(powOfTwo(120)), 'price must be < 2 ** 120')

  // The first number to hash is the oracle name (Maker) and the asset name.
  const first_number = assetPair.shln(40).add(oracleName)

  // The second number is timestamp in the 32 LSB, then the price.
  const second_number = price.shln(32).add(timestamp)

  const w1 = first_number.toString(16)
  const w2 = second_number.toString(16)
  const hash = starkwareCrypto.hashMessage([w1, w2])
  return new BN(hash, 16)
}
