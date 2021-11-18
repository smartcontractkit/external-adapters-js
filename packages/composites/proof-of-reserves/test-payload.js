const protocolEnvironmentVariables = [
  { envKey: 'ADAPTER_URL_WBTC', value: 'wbtc' },
  { envKey: 'ADAPTER_URL_RENVM', value: 'renvm' },
]

const indexerEnvironmentVariables = [
  { envKey: 'ADAPTER_URL_AMBERDATA', value: 'amberdata' },
  { envKey: 'ADAPTER_URL_BITCOIN_JSON_RPC', value: 'bitcoin_json_rpc' },
  { envKey: 'ADAPTER_URL_BLOCKCHAIN_COM', value: 'blockchain_com' },
  { envKey: 'ADAPTER_URL_BLOCKCYPHER', value: 'blockcypher' },
  { envKey: 'ADAPTER_URL_BLOCKCHAIR', value: 'blockchair' },
  { envKey: 'ADAPTER_URL_BTC_COM', value: 'btc_com' },
  { envKey: 'ADAPTER_URL_CRYPTOAPIS', value: 'cryptoapis' },
  { envKey: 'ADAPTER_URL_SOCHAIN', value: 'sochain' },
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

  const indexers = searchEnvironment(indexerEnvironmentVariables)
  const protocols = searchEnvironment(protocolEnvironmentVariables)

  for (const indexer in indexers) {
    for (const protocol in protocols) {
      payload.requests.push({
        indexer,
        protocol,
      })
    }
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
