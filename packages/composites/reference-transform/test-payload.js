// TODO: Load these from @chainlink/ea

const environmentVariables = [
  { envKey: 'ADAPTER_URL_1FORGE', value: '1forge' },
  { envKey: 'ADAPTER_URL_ALPHACHAIN', value: 'alphachain' },
  { envKey: 'ADAPTER_URL_ALPHAVANTAGE', value: 'alphavantage' },
  { envKey: 'ADAPTER_URL_AMBERDATA', value: 'amberdata' },
  { envKey: 'ANYBLOCK', value: 'anyblock' },
  { envKey: 'ADAPTER_URL_BINANCE', value: 'binance' },
  { envKey: 'ADAPTER_URL_BINANCE_DEX', value: 'binance_dex' },
  { envKey: 'ADAPTER_URL_BITEX', value: 'bitex' },
  { envKey: 'ADAPTER_URL_BITSO', value: 'bitso' },
  { envKey: 'ADAPTER_URL_BLOCKCHAIN_COM', value: 'blockchain_com' },
  { envKey: 'ADAPTER_URL_BLOCKCHAIR', value: 'blockchair' },
  { envKey: 'ADAPTER_URL_BLOCKCYPHER', value: 'blockcypher' },
  { envKey: 'ADAPTER_URL_BLOCKSTREAM', value: 'blockstream' },
  { envKey: 'ADAPTER_URL_BRAVENEWCOIN', value: 'bravenewcoin' },
  { envKey: 'ADAPTER_URL_BTC_COM', value: 'btc_com' },
  { envKey: 'ADAPTER_URL_CFBENCHMARKS', value: 'cfbenchmarks' },
  { envKey: 'ADAPTER_URL_COINAPI', value: 'coinapi' },
  { envKey: 'ADAPTER_URL_COINBASE', value: 'coinbase' },
  { envKey: 'ADAPTER_URL_COINCODEX', value: 'coincodex' },
  { envKey: 'ADAPTER_URL_COINGECKO', value: 'coingecko' },
  { envKey: 'ADAPTER_URL_COINLORE', value: 'coinlore' },
  { envKey: 'ADAPTER_URL_COINMARKETCAP', value: 'coinmarketcap' },
  { envKey: 'ADAPTER_URL_COINPAPRIKA', value: 'coinpaprika' },
  { envKey: 'ADAPTER_URL_COINRANKING', value: 'coinranking' },
  { envKey: 'ADAPTER_URL_COVID_TRACKER', value: 'covid_tracker' },
  { envKey: 'ADAPTER_URL_CRYPTOAPIS', value: 'cryptoapis' },
  { envKey: 'ADAPTER_URL_CRYPTOCOMPARE', value: 'cryptocompare' },
  { envKey: 'ADAPTER_URL_CRYPTO_ID', value: 'crypto_id' },
  { envKey: 'ADAPTER_URL_CRYPTOMKT', value: 'cryptomkt' },
  { envKey: 'ADAPTER_URL_CURRENCYLAYER', value: 'currencylayer' },
  { envKey: 'ADAPTER_URL_DERIBIT', value: 'deribit' },
  { envKey: 'ADAPTER_URL_DNS_QUERY', value: 'dns_query' },
  { envKey: 'ADAPTER_URL_DWOLLA', value: 'dwolla' },
  { envKey: 'ADAPTER_URL_DXFEED', value: 'dxfeed' },
  { envKey: 'ADAPTER_URL_DXFEED_SECONDARY', value: 'dxfeed_secondary' },
  { envKey: 'ADAPTER_URL_EODHISTORICALDATA', value: 'eodhistoricaldata' },
  { envKey: 'ADAPTER_URL_ETHERCHAIN', value: 'etherchain' },
  { envKey: 'ADAPTER_URL_ETHGASSTATION', value: 'ethgasstation' },
  { envKey: 'ADAPTER_URL_EXPERT_CAR_BROKER', value: 'expert_car_broker' },
  { envKey: 'ADAPTER_URL_FCSAPI', value: 'fcsapi' },
  { envKey: 'ADAPTER_URL_FINAGE', value: 'finage' },
  { envKey: 'ADAPTER_URL_FINNHUB', value: 'finnhub' },
  { envKey: 'ADAPTER_URL_FIXER', value: 'fixer' },
  { envKey: 'ADAPTER_URL_FMPCLOUD', value: 'fmpcloud' },
  { envKey: 'ADAPTER_URL_GENESIS_VOLATILITY', value: 'genesis_volatility' },
  { envKey: 'ADAPTER_URL_GEODB', value: 'geodb' },
  { envKey: 'ADAPTER_URL_IEXCLOUD', value: 'iexcloud' },
  { envKey: 'ADAPTER_URL_INTRINIO', value: 'intrinio' },
  { envKey: 'ADAPTER_URL_JSON_RPC', value: 'json_rpc' },
  { envKey: 'ADAPTER_URL_KAIKO', value: 'kaiko' },
  { envKey: 'ADAPTER_URL_LCX', value: 'lcx' },
  { envKey: 'ADAPTER_URL_LINKPOOL', value: 'linkpool' },
  { envKey: 'ADAPTER_URL_LITION', value: 'lition' },
  { envKey: 'ADAPTER_URL_MARKETSTACK', value: 'marketstack' },
  { envKey: 'ADAPTER_URL_MESSARI', value: 'messari' },
  { envKey: 'ADAPTER_URL_METALSAPI', value: 'metalsapi' },
  { envKey: 'ADAPTER_URL_NIKKEI', value: 'nikkei' },
  { envKey: 'ADAPTER_URL_NOMICS', value: 'nomics' },
  { envKey: 'ADAPTER_URL_OILPRICEAPI', value: 'oilpriceapi' },
  { envKey: 'ADAPTER_URL_ONCHAIN', value: 'onchain' },
  { envKey: 'ADAPTER_URL_OPEN_EXCHANGE_RATES', value: 'open_exchange_rates' },
  { envKey: 'ADAPTER_URL_ORCHID_BANDWIDTH', value: 'orchid_bandwidth' },
  { envKey: 'ADAPTER_URL_PAXOS', value: 'paxos' },
  { envKey: 'ADAPTER_URL_PAYPAL', value: 'paypal' },
  { envKey: 'ADAPTER_URL_POA', value: 'poa' },
  { envKey: 'ADAPTER_URL_POLYGON', value: 'polygon' },
  { envKey: 'ADAPTER_URL_REDUCE', value: 'reduce' },
  { envKey: 'ADAPTER_URL_RENVM', value: 'renvm' },
  { envKey: 'ADAPTER_URL_SATOSHITANGO', value: 'satoshitango' },
  { envKey: 'ADAPTER_URL_SOCHAIN', value: 'sochain' },
  { envKey: 'ADAPTER_URL_SPORTSDATAIO', value: 'sportsdataio' },
  { envKey: 'ADAPTER_URL_STASIS', value: 'stasis' },
  { envKey: 'ADAPTER_URL_TAAPI', value: 'taapi' },
  { envKey: 'ADAPTER_URL_THERUNDOWN', value: 'therundown' },
  { envKey: 'ADAPTER_URL_TIINGO', value: 'tiingo' },
  { envKey: 'ADAPTER_URL_TRADERMADE', value: 'tradermade' },
  { envKey: 'ADAPTER_URL_TRADINGECONOMICS', value: 'tradingeconomics' },
  { envKey: 'ADAPTER_URL_TRUEUSD', value: 'trueusd' },
  { envKey: 'ADAPTER_URL_TWELVEDATA', value: 'twelvedata' },
  { envKey: 'ADAPTER_URL_UNIBIT', value: 'unibit' },
  { envKey: 'ADAPTER_URL_WBTC', value: 'wbtc' },
  { envKey: 'ADAPTER_URL_XBTO', value: 'xbto' },
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
