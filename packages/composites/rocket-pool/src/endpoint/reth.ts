import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'
import {
  DEFAULT_ETH_USD_PROXY_ADDRESS,
  DEFAULT_RETH_STORAGE_ADDRESS,
  RocketPoolConfig,
} from '../config'
import { Decimal } from 'decimal.js'
import { ethers } from 'ethers'
import rocketStorageAbi from '../abis/rocketStorageAbi.json'

export const supportedEndpoints = ['reth']

export type TInputParameters = {
  quote: 'ETH' | 'USD'
  network: string
  ethUsdProxyAddress: string
  rethStorageAddress: string
}

export const description =
  'This endpoint returns the price of rETH/ETH according to the staking contract on Ethereum mainnet (L1).'

export const inputParameters: InputParameters<TInputParameters> = {
  quote: {
    description: 'Quote currency to pull price for',
    type: 'string',
    required: false,
    options: ['ETH', 'USD'],
    default: 'ETH',
  },
  network: {
    description: 'Network to query for price feed (EA must have `<network>_RPC_URL` configured).',
    type: 'string',
    required: false,
    default: 'ethereum',
  },
  ethUsdProxyAddress: {
    description: 'Address for the ETH/USD price feed on the given network',
    type: 'string',
    required: false,
    default: DEFAULT_ETH_USD_PROXY_ADDRESS,
  },
  rethStorageAddress: {
    description: 'Address for the Rocket Storage contract on the Ethereum network',
    type: 'string',
    required: false,
    default: DEFAULT_RETH_STORAGE_ADDRESS,
  },
}

export const execute: ExecuteWithConfig<RocketPoolConfig> = async (request, _, config) => {
  const { provider } = config

  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const { ethUsdProxyAddress, network, quote, rethStorageAddress } = validator.validated.data

  const rethContract = new ethers.Contract(rethStorageAddress, rocketStorageAbi, provider)
  const rethEthExchangeRate = new Decimal((await rethContract.getExchangeRate()).toString())
  const rethDecimals = new Decimal((await rethContract.decimals()).toString())

  let result = rethEthExchangeRate.div(new Decimal(10).pow(rethDecimals))

  if (quote === 'USD') {
    const ethUsd = await getLatestAnswer(network, ethUsdProxyAddress, 1, undefined, true)
    result = result.mul(new Decimal(ethUsd))
  }

  return Requester.success(
    jobRunID,
    { data: { result: result.toNumber() }, status: 200 },
    config.verbose,
  )
}
