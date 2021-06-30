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
        source: searchEnvironment(),
      },
    }
    return JSON.stringify(payload)
  }
  
  module.exports = generateTestPayload()
  