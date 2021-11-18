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
      contract: '0x1B58B67B2b2Df71b4b0fb6691271E83A0fa36aC5',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
