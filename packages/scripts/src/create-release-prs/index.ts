import { exec, test } from 'shelljs'
import * as fs from 'fs';
import * as path from 'path';
import * as ini from 'ini';
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { getWorkspaceAdapters } from '../workspace'

export async function main(): Promise<void | string> {
  try {
    // Define CLI options
    const commandLineOptions = [
      {
        name: 'adapters',
        multiple: true,
        defaultOption: true,
        description: 'Adapters to include in release PRs',
      },
      { name: 'help', alias: 'h', type: Boolean, description: 'Display usage guide' },
    ]
    const options = commandLineArgs(commandLineOptions)

    // Generate usage guide
    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Release PR creation script',
          content:
            'This script is run from the root of the external-adapter-js/ repo to create a PR in this repo and another PR in infra-k8s to facilitate the release of a subset of adapters.',
        },
        {
          header: 'Options',
          optionList: commandLineOptions,
        },
        {
          content:
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-\njs/packages/scripts/src/create-release-prs',
        },
      ])
      console.log(usage)
      return
    }

    const allAdapters = getWorkspaceAdapters()
    const adaptersToIgnore = []
    if (options.adapters && options.adapters.length > 0) {
      adaptersToIgnore.push(...allAdapters.filter((a) => {
        return !options.adapters.includes(a.descopedName) && !options.adapters.includes(a.descopedName.replace(/-adapter$/, ''))
      }))
    }
    const ignoreArgs = adaptersToIgnore.map((a) => `--ignore ${a.name}`).join(' ')

    exec(`yarn changeset version ${ignoreArgs}`, {
      fatal: true,
    })

    const awsConfigPath = path.join(process.env.HOME, '.aws', 'config')
    const awsConfigText = fs.readFileSync(awsConfigPath).toString()
    const awsConfig = ini.parse(awsConfigText)
    const awsProfileSdlc = awsConfig['profile sdlc']

    if (!awsProfileSdlc) {
      throw new Error('AWS profile "sdlc" not found in ~/.aws/config')
    }

    const sdlcAccountId = 

    const imageRepo = 

    console.log('dskloetx awsConfig', awsConfig['profile sdlc'])

    // gh workflow run --repo smartcontractkit/infra-k8s --ref main "Infra-k8s Image Dispatcher" -F imageRepos=795953128386.dkr.ecr.us-west-2.amazonaws.com/adapters/cmeth-adapter -F gitRepo=dskloet-test-fake-repo-name

    /*
    const testOutput = exec(`yarn test ${this.integrationTestPath}`, {
      fatal: true,
      silent: true,
      env: { ...process.env, ...testEnvOverrides },
    }).toString()
    */

    process.exit(0)
  } catch (error) {
    console.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}

main()
