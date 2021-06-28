const environmentVariables = [
  { envKey: 'FINNHUB_DATA_PROVIDER_URL', value: 'finnhub' },
  { envKey: 'FCSAPI_VOLATILITY_DATA_PROVIDER_URL', value: 'fcsapi' },
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
      contract: '0x5c4939a2ab3A2a9f93A518d81d4f8D0Bc6a68980',
      multiply: 1e8,
      check: 'tradinghours',
      source: searchEnvironment(environmentVariables),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
