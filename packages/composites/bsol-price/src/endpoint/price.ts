import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Config } from '../config'
import * as view from '@chainlink/solana-view-function-adapter'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import * as solanaWeb3 from '@solana/web3.js'
import { AdapterError } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'

export const supportedEndpoints = ['price']

const LAMBERT_DECIMALS = 9

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
): Promise<AdapterResponse> => {
  const _config = view.makeConfig()
  const _execute = view.makeExecute(_config)
  const addresses = [config.solidoAddress, config.bSolAddress, config.stSolAddress]
  const viewFunctionAdapterRequest: AdapterRequest = {
    id: input.id,
    data: {
      addresses: addresses,
    },
  }
  const viewFunctionAdapterResponse = await _execute(viewFunctionAdapterRequest, context)
  const accountsInfo: solanaWeb3.AccountInfo<Buffer | solanaWeb3.ParsedAccountData>[] =
    viewFunctionAdapterResponse.data.accountInformation
  const [solidoRes, bSolRes, stSolReserveRes] = accountsInfo
  const jobRunID = input.data.jobRunID
  const [stSolSupply, solBalance] = readDataFromSolidoAddress(
    jobRunID,
    solidoRes as solanaWeb3.AccountInfo<Buffer>,
    config,
  )
  const bSolSupplyString = (bSolRes as solanaWeb3.AccountInfo<solanaWeb3.ParsedAccountData>).data
    .parsed.info.supply
  const bSolSupply = BigNumber.from(bSolSupplyString)
    .div(BigNumber.from(10).pow(LAMBERT_DECIMALS))
    .toNumber()
  const stSolReservesString = (
    stSolReserveRes as solanaWeb3.AccountInfo<solanaWeb3.ParsedAccountData>
  ).data.parsed.info.tokenAmount.amount
  const stSolReserves = BigNumber.from(stSolReservesString)
    .div(BigNumber.from(10).pow(LAMBERT_DECIMALS))
    .toNumber()
  const bSolStSolPrice = Math.min(solBalance / stSolSupply, bSolSupply / stSolReserves)
  const stSolUSDPriceResp = await getStSOLUSDPrice(input, context)
  const bSOLUSDPrice = stSolUSDPriceResp.data.result * bSolStSolPrice
  return {
    jobRunID: input.id,
    statusCode: 200,
    result: bSOLUSDPrice,
    data: {
      result: bSOLUSDPrice,
    },
  }
}

/**
 * Instructions to fetch values are here https://docs.solana.lido.fi/development/price-oracle/
 * There is a TypeScript library that we should upgrade to in the future but it is currently not available yet
 */
const readDataFromSolidoAddress = (
  jobRunID: string,
  solidoRes: solanaWeb3.AccountInfo<Buffer>,
  config: Config,
): number[] => {
  const dataBytes = solidoRes.data
  const currentVersionNumber = dataBytes[0]
  if (config.solidoContractVersion !== currentVersionNumber)
    throw new AdapterError({
      jobRunID,
      message: `EA Solido Contract version number set to ${config.solidoContractVersion} but contract version number is ${currentVersionNumber}.  Please check that you have set the correct Solido contract address`,
    })
  const stSolSupply = dataBytes.slice(73, 81)
  const solBalance = dataBytes.slice(81, 89)
  const stSolBN = new BN(stSolSupply, 'le')
  const solBalBN = new BN(solBalance, 'le')
  return [
    BigNumber.from(stSolBN.toString()).div(BigNumber.from(10).pow(LAMBERT_DECIMALS)).toNumber(),
    BigNumber.from(solBalBN.toString()).div(BigNumber.from(10).pow(LAMBERT_DECIMALS)).toNumber(),
  ]
}

export const getStSOLUSDPrice = async (
  input: AdapterRequest,
  context: AdapterContext,
): Promise<AdapterResponse> => {
  const _config = TA.makeConfig()
  const _execute = TA.makeExecute(_config)
  const allocations = [
    {
      symbol: 'stSOL',
      balance: BigNumber.from(10).pow(LAMBERT_DECIMALS),
      decimals: LAMBERT_DECIMALS,
    },
  ]
  return await _execute({ id: input.id, data: { ...input.data, allocations } }, context)
}
