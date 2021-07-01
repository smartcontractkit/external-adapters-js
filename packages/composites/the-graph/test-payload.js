const environmentVariables = [
   
  ]
  
  function searchEnvironment() {
    for (const { envKey, value } of environmentVariables) {
      const isSetEnvVar = process.env[envKey]
      if (isSetEnvVar) return value
    }
  }
  
  function generateTestPayload() {
    const payload = {
      request: {
        baseCoinTicker: "UNI",
        quoteCoinTicker: "USDT",
        referenceContract: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
        referenceMagnitude: "100000000",
        referenceAction: "divide",
        source: searchEnvironment(),
      },
    }
    return JSON.stringify(payload)
  }
  
  module.exports = generateTestPayload()
  