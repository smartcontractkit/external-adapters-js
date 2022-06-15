import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters, AdapterResponse } from '@chainlink/types'
import { LIDO_ADDRESS, WITHDRAWAL_ADDRESS, KSM_AGGREGATOR_PROXY, OUTPUT_DECIMALS } from '../config'
import lidoAbi from '../abi/Lido.json'
import ledgerAbi from '../abi/Ledger.json'
import withdrawalAbi from '../abi/Withdrawal.json'
import ksmAggregatorAbi from '../abi/KsmAggregator.json'
import { ethers } from 'ethers'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'

export const supportedEndpoints = ['stksm']

export const description = 'stKSM token price in USD'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (
  request,
  _,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.api.baseURL)

  const wsProvider = new WsProvider(config.api.relayURL)
  const api = await ApiPromise.create({ provider: wsProvider })

  const keyring = new Keyring()
  keyring.setSS58Format(2)

  const lido = new ethers.Contract(LIDO_ADDRESS, lidoAbi, provider)

  const withdrawal = new ethers.Contract(WITHDRAWAL_ADDRESS, withdrawalAbi, provider)

  const ksmAggregator = new ethers.Contract(KSM_AGGREGATOR_PROXY, ksmAggregatorAbi, provider)

  const values = await Promise.all([
    lido.getLedgerAddresses(),
    lido.totalSupply(),
    ksmAggregator.latestRoundData(),
    ksmAggregator.decimals(),
  ])

  let freeBalanceSum = ethers.utils.parseUnits('0', 12)

  for (let ledgerAddress of values[0]) {
    const ledgerContract = new ethers.Contract(ledgerAddress, ledgerAbi, provider)
    const stashAccount = await ledgerContract.stashAccount()
    const hexPair = keyring.addFromAddress(stashAccount)
    // Workaround to bypass strict
    const relayAccount = (await api.query.system.account(hexPair.address)).toHuman()
    let freeBalance = JSON.stringify(relayAccount)
    freeBalance = JSON.parse(freeBalance).data.free
    freeBalanceSum = freeBalanceSum.add(freeBalance.replace(/,/g, ''))
  }

  const bufferedDeposits = await lido.bufferedDeposits()
  const bufferedRedeems = await lido.bufferedRedeems()
  const losses = await withdrawal.totalBalanceForLosses()
  const totalKsm = bufferedDeposits.add(freeBalanceSum).sub(bufferedRedeems).sub(losses)

  const totalStKsm = values[1]
  const ksmUsd = values[2].answer
  const proxyDecimals = values[3]

  const result = ksmUsd
    .mul(ethers.utils.parseUnits('1', OUTPUT_DECIMALS))
    .div(ethers.utils.parseUnits('1', proxyDecimals))
    .mul(totalKsm)
    .div(totalStKsm)
    .toNumber()

  const response = {
    status: 200,
    statusText: 'OK',
    data: { result },
    headers: {},
    config: {},
  }

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
