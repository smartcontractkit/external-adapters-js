import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Validator, Requester, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import * as SA from '@chainlink/uniswap-v2-adapter'
import { Config } from '../config'
import { ethers } from 'ethers'
import { Decimal } from 'decimal.js'
import vaultABI from '../abi/vault.json'

export const supportedEndpoints = ['price']

export type TInputParameters = {
  vaultAddress: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  vaultAddress: {
    required: true,
    description: 'The address of the NFTX vault being queried for.',
    aliases: ['tokenAddress', 'address'],
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const vaultAddress = validator.validated.data.vaultAddress
  const vault = new ethers.Contract(vaultAddress, vaultABI, config.provider)

  let feeExpanded
  try {
    feeExpanded = await vault.randomRedeemFee()
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
  const power = new Decimal(1e18)
  const fee = new Decimal(feeExpanded.toString()).dividedBy(power)

  const _config = SA.makeConfig()
  const _execute = SA.makeExecute(_config)
  // TODO type makeExecute response

  const pricePayload = {
    from: 'WETH',
    to: vaultAddress,
  }
  const priceResponse = await _execute({ id: jobRunID, data: pricePayload }, context)
  const priceInverse = new Decimal(priceResponse.result as any) // WETH per token
  const price = new Decimal(1).div(priceInverse)
  const priceWithFee = new Decimal(1).plus(fee).mul(price)

  const response = {
    data: { fee: fee, price: price, priceWithFee: priceWithFee },
  }
  return Requester.success(jobRunID, response, true)
}
