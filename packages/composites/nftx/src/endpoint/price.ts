import { ExecuteWithConfig } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'
import * as SA from '@chainlink/uniswap-v2-adapter'
import { Config } from '../config'
import { ethers } from 'ethers'
import { Decimal } from 'decimal.js'
import vaultABI from '../abi/vault.json'

export const supportedEndpoints = ['price']

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, {})
  const jobRunID = validator.validated.jobRunID

  const vaultAddress = config.vaultAddress
  const vault = new ethers.Contract(vaultAddress, vaultABI, config.provider)

  const feeExpanded = await vault.randomRedeemFee()
  const power = new Decimal(1e18)
  const fee = new Decimal(feeExpanded.toString()).dividedBy(power)

  const _config = SA.makeConfig()
  const _execute = SA.makeExecute(_config)

  const pricePayload = {
    from: 'WETH',
    to: config.vaultAddress,
  }
  const priceResponse = await _execute({ id: jobRunID, data: pricePayload }, context)
  const priceInverse = new Decimal(priceResponse.result) // WETH per token
  const price = new Decimal(1).div(priceInverse)
  const priceWithFee = new Decimal(1).plus(fee).mul(price)

  const response = {
    data: { fee: fee, price: price, priceWithFee: priceWithFee },
  }
  return Requester.success(jobRunID, response, true)
}
