import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/ea-bootstrap'
import { TALegacyConfig } from '@chainlink/token-allocation-test-adapter'

export interface Config extends BaseConfig, TALegacyConfig {}

export const NAME = 'DEFI_DOZEN'
export const DEFAULT_ENDPOINT = 'allocation'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    amberdata: util.getURL('AMBERDATA'),
    coinapi: util.getURL('COINAPI'),
    coinranking: util.getURL('COINRANKING'),
    finage: util.getURL('FINAGE'),
    cfbenchmarks: util.getURL('CFBENCHMARKS'),
    coingecko: util.getURL('COINGECKO'),
    coinmarketcap: util.getURL('COINMARKETCAP'),
    coinmetrics: util.getURL('COINMETRICS'),
    coinpaprika: util.getURL('COINPAPRIKA'),
    cryptocompare: util.getURL('CRYPTOCOMPARE'),
    kaiko: util.getURL('KAIKO'),
    ncfx: util.getURL('NCFX'),
    tiingo: util.getURL('TIINGO'),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
