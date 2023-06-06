import { Logger } from '@chainlink/ea-bootstrap'
import axios, { AxiosRequestConfig } from 'axios'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { DepositEvent_ABI } from '../abi/DepositAbi'
import { Address } from './balance'

const DEPOSIT_EVENT_TOPIC = '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
const DEPOSIT_EVENT_LOOKBACK_WINDOW = 10_000 // blocks
const GWEI_DIVISOR = 1_000_000_000

// Value must be in wei
export function formatValueInGwei(value: BigNumber): string {
  return value.div(GWEI_DIVISOR).toString()
}

export const chunkArray = <T>(addresses: T[], size: number): T[][] =>
  addresses.length > size
    ? [addresses.slice(0, size), ...chunkArray(addresses.slice(size), size)]
    : [addresses]

// Parse little endian value from deposit event and convert to wei
export const parseLittleEndian = (value: string): BigNumber => {
  const result = []
  let start = value.length - 2
  while (start >= 2) {
    result.push(value.substring(start, start + 2))
    start -= 2
  }
  const convertDecimal = BigNumber(`0x${result.join('')}`)
  return BigNumber(ethers.utils.parseUnits(convertDecimal.toString(), 'gwei').toString())
}

export const withErrorHandling = async <T>(stepName: string, fn: () => T) => {
  try {
    const result = await fn()
    Logger.debug(`${stepName} | got result: ${result}`)
    return result
  } catch (e) {
    Logger.error({ error: e })
    throw new Error(`Failed step: ${stepName}`)
  }
}

// Get the address for the ETH deposit contract
export const fetchEthDepositContractAddress = async (baseURL: string): Promise<string> => {
  const url = `/eth/v1/config/deposit_contract`
  const options: AxiosRequestConfig = {
    baseURL,
    url,
  }

  return withErrorHandling(`Fetch ETH deposit contract address`, async () => {
    const response = await axios.request<{ data: { chainId: string; address: string } }>(options)
    return response.data.data.address
  })
}

// Get event logs to find deposit events for addresses not on the beacon chain yet
// Returns deposit amount in wei
export const fetchLimboEthBalances = async (
  limboAddressMap: Record<string, Address> = {},
  beaconRpcUrl: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Record<string, BigNumber>> => {
  // Aggregate balances in map in case validators have multiple deposit events
  const limboBalances: Record<string, BigNumber> = {}

  // Skip fetching logs if no addresses in limbo to search for
  if (Object.entries(limboAddressMap).length === 0) {
    return limboBalances
  }

  const latestBlockNum = await provider.getBlockNumber()

  const ethDepositContractAddress = await fetchEthDepositContractAddress(beaconRpcUrl)

  // Get all the deposit logs from the last DEPOSIT_EVENT_LOOKBACK_WINDOW blocks
  const logs = await provider.getLogs({
    address: ethDepositContractAddress,
    topics: [DEPOSIT_EVENT_TOPIC],
    fromBlock: latestBlockNum - DEPOSIT_EVENT_LOOKBACK_WINDOW,
    toBlock: latestBlockNum,
  })

  if (logs.length === 0) {
    Logger.debug(
      `No deposit event logs found in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks or the provider failed to return any.`,
    )
    return limboBalances
  }

  Logger.debug(
    `Found ${logs.length} deposit events in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks`,
  )

  // Parse the fetched logs with the deposit event interface
  const depositEventInterface = new ethers.utils.Interface(DepositEvent_ABI)
  const parsedlogs = logs
    .map((l) => depositEventInterface.parseLog(l))
    .map((l) => ({
      address: l.args[0].toLowerCase(),
      amount: parseLittleEndian(l.args[2].toString()),
    }))

  for (const { address, amount } of parsedlogs) {
    if (limboAddressMap[address]) {
      Logger.debug(`Found deposit event for validator ${address}`)
      // If address found in limbo balance map, multiple deposit events exists for validator. Sum all of them
      if (limboBalances[address]) {
        limboBalances[address] = limboBalances[address].plus(amount)
      } else {
        limboBalances[address] = amount
      }
    }
  }

  return limboBalances
}
