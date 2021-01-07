import assert from 'assert'
import BN from 'bn.js'
import * as starkwareCrypto from '@authereum/starkware-crypto'

const ZERO_BN = new BN('0')
const TWO_BN = new BN('2')

const powOfTwo = (num: number) => TWO_BN.pow(new BN(num))

// #####################################################################################
// # getPriceMessage: gets as input:                                                   #
// #       oracle: a 40-bit number, describes the oracle (i.e hex encoding of "Maker") #
// #       price: a 120-bit number                                                     #
// #       asset: a 128-bit number                                                     #
// #       timestamp: a 32 bit number, represents seconds since epoch                  #
// # outputs a number which is less than FIELD_PRIME, which can be used as data        #
// # to sign on in the sign method. This number is obtained by applying pedersen       #
// # on the following two numbers:                                                     #
// #                                                                                   #
// # first number:                                                                     #
// # --------------------------------------------------------------------------------- #
// # | 0 (84 bits)       | asset_name (128 bits)         |   oracle_name (40 bits)   | #
// # --------------------------------------------------------------------------------- #
// #                                                                                   #
// # second number:                                                                    #
// # --------------------------------------------------------------------------------- #
// # | 0 (100 bits)         | price (120 bits)             |   timestamp (32 bits)   | #
// # --------------------------------------------------------------------------------- #
// #                                                                                   #
// #####################################################################################

export const getPriceMessage = (oracle_name: BN, asset_pair: BN, timestamp: BN, price: BN): BN => {
  assert(oracle_name.gte(ZERO_BN), 'oracle_name must be >= 0')
  assert(oracle_name.lt(powOfTwo(40)), 'oracle_name must be < 2 ** 40')

  assert(asset_pair.gte(ZERO_BN), 'asset_pair must be >= 0')
  assert(asset_pair.lt(powOfTwo(128)), 'asset_pair must be < 2 ** 128')

  assert(timestamp.gte(ZERO_BN), 'timestamp must be >= 0')
  assert(timestamp.lt(powOfTwo(32)), 'timestamp must be < 2 ** 32')

  assert(price.gte(ZERO_BN), 'price must be >= 0')
  assert(price.lt(powOfTwo(120)), 'price must be < 2 ** 120')

  // The first number to hash is the oracle name (Maker) and the asset name.
  const first_number = asset_pair.shln(40).add(oracle_name)

  // The second number is timestamp in the 32 LSB, then the price.
  const second_number = price.shln(32).add(timestamp)

  const w1 = first_number.toString(16)
  const w2 = second_number.toString(16)
  return new BN(starkwareCrypto.hashMessage([w1, w2]), 16)
}
