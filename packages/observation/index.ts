import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { config } from './config'

const HEADERS = 'round,staging,production,timestamp'

/** Validate outputFileName to prevent path traversal; only allow safe basenames */
function getSafeOutputPath(fileName: string): string {
  const basename = path.basename(fileName)
  if (basename !== fileName || basename.includes('..')) {
    throw new Error(`Invalid output file name: ${fileName}`)
  }
  return basename
}
const stagingURL = `https://adapters.main.stage.cldev.sh/${config.adapterName}`
const prodURL = `https://adapters.main.prod.cldev.sh/${config.adapterName}`

interface AdapterResult {
  stagingResult: string | number
  prodResult: string | number
  timestamp: number
}

const getResultFromAdapter = async (i: number): Promise<AdapterResult> => {
  try {
    const stagingResp = await axios.post(stagingURL, config.request)
    const prodResp = await axios.post(prodURL, config.request)
    return {
      stagingResult: stagingResp.data.result,
      prodResult: prodResp.data.result,
      timestamp: Date.now(),
    }
  } catch (e: any) {
    console.log(e)
    console.log('Retrying request ', i)
    return await getResultFromAdapter(i)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

;(async () => {
  const outputPath = getSafeOutputPath(config.outputFileName)
  fs.writeFileSync(outputPath, HEADERS)
  const numRequests = config.testDurationInSeconds / config.reqIntervalInSeconds
  console.log(HEADERS)
  for (let i = 0; i < numRequests; i++) {
    const result = await getResultFromAdapter(i)
    let content = `\n${i}`
    content += `, ${result.stagingResult}, ${result.prodResult}, ${new Date().toISOString()}`
    console.log(content)
    fs.appendFileSync(outputPath, content)
    await sleep(config.reqIntervalInSeconds * 1000)
  }
})()
