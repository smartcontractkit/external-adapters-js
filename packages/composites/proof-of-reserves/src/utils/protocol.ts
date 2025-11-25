import { AdapterContext, AdapterResponse, Config, Requester } from '@chainlink/ea-bootstrap'
import { callAdapter, makeRequestFactory } from '.'

export const LIST_ADAPTER = 'LIST'

export const adapterNamesV2 = {
  renVM: 'RENVM',
  celsiusAddressList: 'CELSIUS_ADDRESS_LIST',
  chainReserveWallets: 'CHAIN_RESERVE_WALLET',
  wrapped: 'WRAPPED',
  swellList: 'SWELL_ADDRESS_LIST',
}

export const adapterNamesV3 = {
  moonbeamAddressList: 'MOONBEAM_ADDRESS_LIST',
  staderList: 'STADER_ADDRESS_LIST',
  wBTC: 'WBTC',
  gemini: 'GEMINI',
  porAddressList: 'POR_ADDRESS_LIST',
  coinbasePrime: 'COINBASE_PRIME',
  multiAddressList: 'MULTI_ADDRESS_LIST',
  ignitionAddressList: 'IGNITION_ADDRESS_LIST',
}

type AddressData = ({ token: string; chainId: string; network: string } | AddressList) & {
  endpoint: string
}

type AddressList =
  | { addresses: string[]; chainId: string; network: string }
  | { addresses: AddressObject[] }

type AddressObject = { address: string; network: string; chainId: string }

// Get address set for protocol
export const runProtocolAdapter = async (
  jobRunID: string,
  context: AdapterContext,
  protocol: string,
  data: AddressData,
  config: Config,
  protocolEndpoint?: string,
): Promise<AdapterResponse> => {
  if (protocolEndpoint) {
    data.endpoint = protocolEndpoint
  }

  if (protocol === LIST_ADAPTER) return listAdapter(jobRunID, data)

  const execute = makeRequestFactory(config, protocol)
  const next = {
    id: jobRunID,
    data,
  }
  return callAdapter(execute, context, next, '_onProtocol')
}

const listAdapter = (jobRunID: string, data: AddressData) => {
  if (!('addresses' in data)) {
    throw Error(`Missing "addresses" in request data`)
  }
  if ((data.addresses as string[]).every((address: string) => typeof address === 'string')) {
    const result = (data.addresses as string[]).map((address: string) => ({
      address,
      network: (data as { addresses: string[]; chainId: string; network: string }).network,
      chainId: (data as { addresses: string[]; chainId: string; network: string }).chainId,
    }))
    return Requester.success(jobRunID, { data: { result } })
  }
  if (
    (data.addresses as AddressObject[]).every(
      ({ address, chainId, network }: AddressObject) =>
        typeof address === 'string' && typeof chainId === 'string' && typeof network === 'string',
    )
  ) {
    return Requester.success(jobRunID, { data: { result: data.addresses } })
  }
  throw Error('Invalid data received for list addresses parameter')
}
