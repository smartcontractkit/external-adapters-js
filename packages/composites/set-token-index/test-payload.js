const environmentVariables = [
  { envKey: 'ADAPTER_URL_AMBERDATA', defaultValue: 'amberdata' },
  { envKey: 'ADAPTER_URL_COINAPI', defaultValue: 'coinapi' },
  { envKey: 'ADAPTER_URL_COINGECKO', defaultValue: 'coingecko' },
  { envKey: 'ADAPTER_URL_COINMARKETCAP', defaultValue: 'coinmarketcap' },
  { envKey: 'ADAPTER_URL_COINPAPRIKA', defaultValue: 'coinpaprika' },
  { envKey: 'ADAPTER_URL_CRYPTOCOMPARE', defaultValue: 'cryptocompare' },
  { envKey: 'ADAPTER_URL_KAIKO', defaultValue: 'kaiko' },
  { envKey: 'ADAPTER_URL_NOMICS', defaultValue: 'nomics' },
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
      adapter: '0x78733fa5e70e3ab61dc49d93921b289e4b667093',
      address: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
      asset: 'DPI',
      name: 'DPI / USD',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
