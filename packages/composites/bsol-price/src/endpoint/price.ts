import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Config } from '../config'
import * as solanaViewFunction from '@chainlink/solana-view-function-adapter'
import BN from 'bn.js'
import * as solanaWeb3 from '@solana/web3.js'
import { AdapterError } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'
import BigNumber from 'bignumber.js'

export const supportedEndpoints = ['price']

const LAMBERT_DECIMALS = 9

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
): Promise<AdapterResponse> => {
  const addresses = [config.solidoAddress, config.bSolAddress, config.stSolAddress]
  const jobRunID = input.data.jobRunID
  const accountsInfo = await getAccountsInformation(jobRunID, context, addresses)
  const bSOLUSDPrice = await getBSolUSDPrice(jobRunID, config, input, context, accountsInfo)
  return {
    jobRunID: input.id,
    statusCode: 200,
    result: bSOLUSDPrice,
    data: {
      result: bSOLUSDPrice,
    },
  }
}

const getAccountsInformation = async (
  jobRunID: string,
  context: AdapterContext,
  addresses: string[],
): Promise<solanaWeb3.AccountInfo<Buffer | solanaWeb3.ParsedAccountData>[]> => {
  const _config = solanaViewFunction.makeConfig()
  const _execute = solanaViewFunction.makeExecute(_config)
  const solanaViewFunctionAdapterRequest: AdapterRequest = {
    id: jobRunID,
    data: {
      addresses,
    },
  }
  const solanaViewFunctionAdapterResponse = await _execute(
    solanaViewFunctionAdapterRequest,
    context,
  )
  const accountsInfo: solanaWeb3.AccountInfo<Buffer | solanaWeb3.ParsedAccountData>[] =
    solanaViewFunctionAdapterResponse.data.accountInformation
  return accountsInfo
}

// Methodology to get the BSol/StSol price https://docs.solana.lido.fi/development/price-oracle/
const getBSolUSDPrice = async (
  jobRunID: string,
  config: Config,
  input: AdapterRequest,
  context: AdapterContext,
  accountsInfo: solanaWeb3.AccountInfo<Buffer | solanaWeb3.ParsedAccountData>[],
) => {
  const [solidoRes, bSolRes, stSolReserveRes] = accountsInfo
  const [stSolSupply, solBalance] = readDataFromSolidoAddress(
    jobRunID,
    solidoRes as solanaWeb3.AccountInfo<Buffer>,
    config,
  )
  const [bSolSupply, stSolReserves] = getBSolSupplyAndStSolReserves(bSolRes, stSolReserveRes)
  const bSolStSolPrice = BigNumber.min(
    stSolSupply.dividedBy(solBalance),
    stSolReserves.dividedBy(bSolSupply),
  ).toNumber()
  const stSolUSDPriceResp = await getStSOLUSDPrice(input, context)
  return stSolUSDPriceResp.data.result * bSolStSolPrice
}

const getBSolSupplyAndStSolReserves = (
  bSolRes: solanaWeb3.AccountInfo<Buffer | solanaWeb3.ParsedAccountData>,
  stSolReserveRes: solanaWeb3.AccountInfo<Buffer | solanaWeb3.ParsedAccountData>,
): BigNumber[] => {
  const bSolSupply = new BigNumber(
    (bSolRes as solanaWeb3.AccountInfo<solanaWeb3.ParsedAccountData>).data.parsed.info.supply,
  )
  const stSolReserves = new BigNumber(
    (
      stSolReserveRes as solanaWeb3.AccountInfo<solanaWeb3.ParsedAccountData>
    ).data.parsed.info.tokenAmount.amount,
  )
  return [bSolSupply, stSolReserves]
}

/**
 * Instructions to fetch values are here https://docs.solana.lido.fi/development/price-oracle/
 * There is a TypeScript library that we should upgrade to in the future but it is currently not available yet
 */
const readDataFromSolidoAddress = (
  jobRunID: string,
  solidoRes: solanaWeb3.AccountInfo<Buffer>,
  config: Config,
): BigNumber[] => {
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
  return [new BigNumber(stSolBN.toString()), new BigNumber(solBalBN.toString())]
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
      balance: new BigNumber(10).pow(LAMBERT_DECIMALS),
      decimals: LAMBERT_DECIMALS,
    },
  ]
  return await _execute(
    { id: input.id, data: { ...input.data, allocations, quote: 'USD', method: 'price' } },
    context,
  )
}
