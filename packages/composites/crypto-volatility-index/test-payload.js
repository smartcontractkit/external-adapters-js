const environmentVariables = [
  { envKey: 'AMBERDATA_ADAPTER_URL', defaultValue: 'amberdata' },
  { envKey: 'COINAPI_ADAPTER_URL', defaultValue: 'coinapi' },
  { envKey: 'COINGECKO_ADAPTER_URL', defaultValue: 'coingecko' },
  { envKey: 'COINMARKETCAP_ADAPTER_URL', defaultValue: 'coinmarketcap' },
  { envKey: 'COINPAPRIKA_ADAPTER_URL', defaultValue: 'coinpaprika' },
  { envKey: 'CRYPTOCOMPARE_ADAPTER_URL', defaultValue: 'cryptocompare' },
  { envKey: 'KAIKO_ADAPTER_URL', defaultValue: 'kaiko' },
  { envKey: 'NOMICS_ADAPTER_URL', defaultValue: 'nomics' },
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
