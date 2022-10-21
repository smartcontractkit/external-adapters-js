const environmentVariables = [
  { envKey: 'FINNHUB_ADAPTER_URL', value: 'finnhub' },
  { envKey: 'FCSAPI_VOLATILITY_ADAPTER_URL', value: 'fcsapi' },
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
      contract: '0x5c4939a2ab3A2a9f93A518d81d4f8D0Bc6a68980',
      multiply: 1e8,
      check: 'tradinghours',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
