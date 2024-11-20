const protocolEnvironmentVariables = [
  { envKey: 'WBTC_ADAPTER_URL', value: 'wbtc' },
  { envKey: 'RENVM_ADAPTER_URL', value: 'renvm' },
  { envKey: 'CELSIUS_ADDRESS_LIST_ADAPTER_URL', value: 'celsius_address_list' },
]

const indexerEnvironmentVariables = [
  { envKey: 'AMBERDATA_ADAPTER_URL', value: 'amberdata' },
  { envKey: 'BITCOIN_JSON_RPC_ADAPTER_URL', value: 'bitcoin_json_rpc' },
  { envKey: 'BLOCKCHAIN_COM_ADAPTER_URL', value: 'blockchain_com' },
  { envKey: 'BLOCKCYPHER_ADAPTER_URL', value: 'blockcypher' },
  { envKey: 'BLOCKCHAIR_ADAPTER_URL', value: 'blockchair' },
  { envKey: 'BTC_COM_ADAPTER_URL', value: 'btc_com' },
  { envKey: 'CRYPTOAPIS_ADAPTER_URL', value: 'cryptoapis' },
  { envKey: 'POR_INDEXER_ADAPTER_URL', value: 'por_indexer' },
  { envKey: 'TOKEN_BALANCE_ADAPTER_URL', value: 'token_balance' },
  { envKey: 'SOCHAIN_ADAPTER_URL', value: 'sochain' },
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
