import * as fs from 'fs'
import * as dotenv from 'dotenv'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)
const promises: Promise<void>[] = []
;(async () => {
  const args = process.argv.slice(2)

  args.forEach((adapterName) => {
    console.log('Preparing upper limit tests for ${adapterName}')
    const adapterUrl = `http://${adapterName}-adapter:8080` // http://coingecko-adapter:8080
    const networkName = `${adapterName}-network` // coingecko-network

    // .(dist)/adapter-http.json is created in automate-start.sh, which we tell users to run in the README
    // If for some reason, we can't find it, instruct the user to run automate-start.sh
    const hostPayloadPath = `src/config/payloads/${adapterName}-http.json`
    if (!fs.existsSync(hostPayloadPath)) {
      console.log(
        `ERROR: Could not find the payload file for ${adapterName} at ${hostPayloadPath}. Are you running this from the root of the k6 directory, and did you run automate-start.sh?`,
      )
    }

    //limits.env contains the base config for the k6 tests
    const limits = dotenv.parse(fs.readFileSync(`./limits.env`))

    // Build up environment variables for the k6 container
    const env: { [key: string]: string } = {
      ...limits,
      PAYLOAD_PATH: `/config/${adapterName}-http.json`,
      ADAPTER_URL: adapterUrl,
      CI_ADAPTER_NAME: adapterName,
    }
    const envPreamble = Object.keys(env).reduce((acc, key) => {
      return `${acc} -e ${key}=${env[key]}`
    }, '')

    // With the environment variables set, we can now build the command to create the k6 container
    const cmd = `docker run --network=${networkName} --rm -v $(pwd)/dist:/load -v $(pwd)/src/config/payloads:/config/ --env-file limits.env ${envPreamble} \
    --name ${adapterName}-k6 \
    -i loadimpact/k6 run /load/testLimits.js`
    console.log(`Preparing to test ${adapterName} using the following command: `, cmd)

    // Queue up all the docker commands, so we can run them in parallel
    promises.push(
      execPromise(cmd)
        .then(({ stdout, stderr }) => {
          fs.writeFileSync(`./dist/${adapterName}.log`, stdout + stderr)
          console.log(
            `Finished running tests for ${adapterName}. See ./dist/${adapterName}.log for details.`,
          )
        })
        .catch((err) => {
          fs.writeFileSync(`./dist/${adapterName}.log`, `${err}`)
          console.log(
            `Error running tests for ${adapterName}, see ./dist/${adapterName}.log for details`,
          )
        }),
    )
  })
  await Promise.all(promises)
})()
