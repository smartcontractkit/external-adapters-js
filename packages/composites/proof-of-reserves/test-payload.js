const protocolEnvironmentVariables = [
  { envKey: 'WBTC_DATA_PROVIDER_URL', value: 'wbtc' },
  { envKey: 'RENVM_DATA_PROVIDER_URL', value: 'renvm' },
]

const indexerEnvironmentVariables = [
  { envKey: 'AMBERDATA_DATA_PROVIDER_URL', value: 'amberdata' },
  { envKey: 'BITCOIN_JSON_RPC_DATA_PROVIDER_URL', value: 'bitcoin_json_rpc' },
  { envKey: 'BLOCKCHAIN_COM_DATA_PROVIDER_URL', value: 'blockchain_com' },
  { envKey: 'BLOCKCYPHER_DATA_PROVIDER_URL', value: 'blockcypher' },
  { envKey: 'BLOCKCHAIR_DATA_PROVIDER_URL', value: 'blockchair' },
  { envKey: 'BTC_COM_DATA_PROVIDER_URL', value: 'btc_com' },
  { envKey: 'CRYPTOAPIS_DATA_PROVIDER_URL', value: 'cryptoapis' },
  { envKey: 'SOCHAIN_DATA_PROVIDER_URL', value: 'sochain' },
]

function searchEnvironment(environmentVariables) {
  for (const { envKey, value } of environmentVariables) {
    const isSetEnvVar = process.env[envKey]
    if (isSetEnvVar) return value
  }
}

function generateTestPayload() {
  const payload = {
    request: {
      indexer: searchEnvironment(indexerEnvironmentVariables),
      protocol: searchEnvironment(protocolEnvironmentVariables),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
