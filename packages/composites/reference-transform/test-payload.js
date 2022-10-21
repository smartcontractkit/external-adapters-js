// TODO: Load these from @chainlink/ea

const environmentVariables = [
  { envKey: '1FORGE_ADAPTER_URL', value: '1forge' },
  { envKey: 'ALPHACHAIN_ADAPTER_URL', value: 'alphachain' },
  { envKey: 'ALPHAVANTAGE_ADAPTER_URL', value: 'alphavantage' },
  { envKey: 'AMBERDATA_ADAPTER_URL', value: 'amberdata' },
  { envKey: 'ANYBLOCK', value: 'anyblock' },
  { envKey: 'BINANCE_ADAPTER_URL', value: 'binance' },
  { envKey: 'BINANCE_DEX_ADAPTER_URL', value: 'binance_dex' },
  { envKey: 'BITEX_ADAPTER_URL', value: 'bitex' },
  { envKey: 'BITSO_ADAPTER_URL', value: 'bitso' },
  { envKey: 'BLOCKCHAIN_COM_ADAPTER_URL', value: 'blockchain_com' },
  { envKey: 'BLOCKCHAIR_ADAPTER_URL', value: 'blockchair' },
  { envKey: 'BLOCKCYPHER_ADAPTER_URL', value: 'blockcypher' },
  { envKey: 'BLOCKSTREAM_ADAPTER_URL', value: 'blockstream' },
  { envKey: 'BRAVENEWCOIN_ADAPTER_URL', value: 'bravenewcoin' },
  { envKey: 'BTC_COM_ADAPTER_URL', value: 'btc_com' },
  { envKey: 'CFBENCHMARKS_ADAPTER_URL', value: 'cfbenchmarks' },
  { envKey: 'COINAPI_ADAPTER_URL', value: 'coinapi' },
  { envKey: 'COINBASE_ADAPTER_URL', value: 'coinbase' },
  { envKey: 'COINCODEX_ADAPTER_URL', value: 'coincodex' },
  { envKey: 'COINGECKO_ADAPTER_URL', value: 'coingecko' },
  { envKey: 'COINLORE_ADAPTER_URL', value: 'coinlore' },
  { envKey: 'COINMARKETCAP_ADAPTER_URL', value: 'coinmarketcap' },
  { envKey: 'COINPAPRIKA_ADAPTER_URL', value: 'coinpaprika' },
  { envKey: 'COINRANKING_ADAPTER_URL', value: 'coinranking' },
  { envKey: 'COVID_TRACKER_ADAPTER_URL', value: 'covid_tracker' },
  { envKey: 'CRYPTOAPIS_ADAPTER_URL', value: 'cryptoapis' },
  { envKey: 'CRYPTOCOMPARE_ADAPTER_URL', value: 'cryptocompare' },
  { envKey: 'CRYPTO_ID_ADAPTER_URL', value: 'crypto_id' },
  { envKey: 'CRYPTOMKT_ADAPTER_URL', value: 'cryptomkt' },
  { envKey: 'CURRENCYLAYER_ADAPTER_URL', value: 'currencylayer' },
  { envKey: 'DERIBIT_ADAPTER_URL', value: 'deribit' },
  { envKey: 'DNS_QUERY_ADAPTER_URL', value: 'dns_query' },
  { envKey: 'DWOLLA_ADAPTER_URL', value: 'dwolla' },
  { envKey: 'DXFEED_ADAPTER_URL', value: 'dxfeed' },
  { envKey: 'DXFEED_SECONDARY_ADAPTER_URL', value: 'dxfeed_secondary' },
  { envKey: 'EODHISTORICALDATA_ADAPTER_URL', value: 'eodhistoricaldata' },
  { envKey: 'ETHERCHAIN_ADAPTER_URL', value: 'etherchain' },
  { envKey: 'ETHGASSTATION_ADAPTER_URL', value: 'ethgasstation' },
  { envKey: 'EXPERT_CAR_BROKER_ADAPTER_URL', value: 'expert_car_broker' },
  { envKey: 'FCSAPI_ADAPTER_URL', value: 'fcsapi' },
  { envKey: 'FINAGE_ADAPTER_URL', value: 'finage' },
  { envKey: 'FINNHUB_ADAPTER_URL', value: 'finnhub' },
  { envKey: 'FIXER_ADAPTER_URL', value: 'fixer' },
  { envKey: 'FMPCLOUD_ADAPTER_URL', value: 'fmpcloud' },
  { envKey: 'GENESIS_VOLATILITY_ADAPTER_URL', value: 'genesis_volatility' },
  { envKey: 'GEODB_ADAPTER_URL', value: 'geodb' },
  { envKey: 'IEXCLOUD_ADAPTER_URL', value: 'iexcloud' },
  { envKey: 'INTRINIO_ADAPTER_URL', value: 'intrinio' },
  { envKey: 'JSON_RPC_ADAPTER_URL', value: 'json_rpc' },
  { envKey: 'KAIKO_ADAPTER_URL', value: 'kaiko' },
  { envKey: 'LCX_ADAPTER_URL', value: 'lcx' },
  { envKey: 'LINKPOOL_ADAPTER_URL', value: 'linkpool' },
  { envKey: 'LITION_ADAPTER_URL', value: 'lition' },
  { envKey: 'MARKETSTACK_ADAPTER_URL', value: 'marketstack' },
  { envKey: 'MESSARI_ADAPTER_URL', value: 'messari' },
  { envKey: 'METALSAPI_ADAPTER_URL', value: 'metalsapi' },
  { envKey: 'NIKKEI_ADAPTER_URL', value: 'nikkei' },
  { envKey: 'NOMICS_ADAPTER_URL', value: 'nomics' },
  { envKey: 'OILPRICEAPI_ADAPTER_URL', value: 'oilpriceapi' },
  { envKey: 'ONCHAIN_ADAPTER_URL', value: 'onchain' },
  { envKey: 'OPEN_EXCHANGE_RATES_ADAPTER_URL', value: 'open_exchange_rates' },
  { envKey: 'ORCHID_BANDWIDTH_ADAPTER_URL', value: 'orchid_bandwidth' },
  { envKey: 'PAXOS_ADAPTER_URL', value: 'paxos' },
  { envKey: 'PAYPAL_ADAPTER_URL', value: 'paypal' },
  { envKey: 'POA_ADAPTER_URL', value: 'poa' },
  { envKey: 'POLYGON_ADAPTER_URL', value: 'polygon' },
  { envKey: 'REDUCE_ADAPTER_URL', value: 'reduce' },
  { envKey: 'RENVM_ADAPTER_URL', value: 'renvm' },
  { envKey: 'SATOSHITANGO_ADAPTER_URL', value: 'satoshitango' },
  { envKey: 'SOCHAIN_ADAPTER_URL', value: 'sochain' },
  { envKey: 'SPORTSDATAIO_ADAPTER_URL', value: 'sportsdataio' },
  { envKey: 'STASIS_ADAPTER_URL', value: 'stasis' },
  { envKey: 'TAAPI_ADAPTER_URL', value: 'taapi' },
  { envKey: 'THERUNDOWN_ADAPTER_URL', value: 'therundown' },
  { envKey: 'TIINGO_ADAPTER_URL', value: 'tiingo' },
  { envKey: 'TRADERMADE_ADAPTER_URL', value: 'tradermade' },
  { envKey: 'TRADINGECONOMICS_ADAPTER_URL', value: 'tradingeconomics' },
  { envKey: 'TRUEUSD_ADAPTER_URL', value: 'trueusd' },
  { envKey: 'TWELVEDATA_ADAPTER_URL', value: 'twelvedata' },
  { envKey: 'UNIBIT_ADAPTER_URL', value: 'unibit' },
  { envKey: 'WBTC_ADAPTER_URL', value: 'wbtc' },
  { envKey: 'XBTO_ADAPTER_URL', value: 'xbto' },
]

function searchEnvironment(environmentVariables) {
  const values = []
  for (const { envKey, value } of environmentVariables) {
    const isSetEnvVar = process.env[envKey]
    if (isSetEnvVar) values.push(value)
  }
  return values
}

function generateTestPayload() {
  const payload = {
    requests: [],
  }

  const sources = searchEnvironment(environmentVariables)

  for (const source in sources) {
    payload.requests.push({
      referenceContract: '0x1B58B67B2b2Df71b4b0fb6691271E83A0fa36aC5',
      operator: 'multiply',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
