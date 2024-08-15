import { AdapterRequest, Logger } from '@chainlink/ea-bootstrap'
import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'

import { AdapterName, Config, Market } from './config'

const marketAdapters: Record<Market, Record<'primary' | 'secondary', AdapterName>> = {
  forex: {
    primary: 'tradinghours',
    secondary: 'ncfx',
  },
  metals: {
    primary: 'tradinghours',
    secondary: 'ncfx',
  },
}

export const isMarket = (market: string): market is Market => {
  return market in marketAdapters
}

export const getMarketStatus = async (
  input: AdapterRequest,
  config: Config,
  market: Market,
): Promise<MarketStatus> => {
  const primaryAdapterName = marketAdapters[market].primary
  const primaryAdapter = config.getMarketStatusAdapter(primaryAdapterName)
  const primaryMarketStatus = await primaryAdapter(input)
  if (primaryMarketStatus !== MarketStatus.UNKNOWN) {
    return primaryMarketStatus
  }
  Logger.warn(`primary adapter ${primaryAdapterName} returned unknown market status`)

  const secondaryAdapterName = marketAdapters[market].secondary
  const secondaryAdapter = config.getMarketStatusAdapter(secondaryAdapterName)
  const secondaryMarketStatus = await secondaryAdapter(input)
  if (secondaryMarketStatus !== MarketStatus.UNKNOWN) {
    return secondaryMarketStatus
  }
  Logger.error(`secondary adapter ${secondaryAdapterName} returned unknown market status`)

  return MarketStatus.CLOSED
}
