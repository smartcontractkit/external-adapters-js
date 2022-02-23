import * as shell from 'shelljs'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { Adapter, Blacklist, BooleanMap } from './types'

import { ReadmeGenerator, getJsonFile } from './generator'

const pathToBlacklist = 'packages/scripts/src/generate-readme/readmeBlacklist.json'

const pathToSources = 'packages/sources/'

export async function main(): Promise<void | string> {
  try {
    // Define CLI options
    const commandLineOptions = [
      {
        name: 'all',
        alias: 'a',
        type: Boolean,
        description: 'Generate READMEs for all source EAs not in blacklist',
      },
      {
        name: 'verbose',
        alias: 'v',
        type: Boolean,
        description: 'Include extra logs for each generation process',
      },
      {
        name: 'testPath',
        alias: 't',
        type: String,
        description: 'Run script as test for EA along given path',
      },
      {
        name: 'adapters',
        multiple: true,
        defaultOption: true,
        description: 'Generate READMEs for all source EAs given by name',
      },
      { name: 'help', alias: 'h', type: Boolean, description: 'Display usage guide' },
    ]
    const options = commandLineArgs(commandLineOptions)

    // Generate usage guide
    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'README Generator Script',
          content:
            'This script is run from the root of the external-adapter-js/ repo to generate READMEs for supported external adapters. This functionality is currently limited to a subset of source adapters only.',
        },
        {
          header: 'Options',
          optionList: commandLineOptions,
        },
        {
          content:
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-\njs/packages/scripts/src/generate-readme/}',
        },
      ])
      console.log(usage)
      return
    }

    console.log('Generating READMEs')

    // Test setting
    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath, options.verbose)
      await readmeGenerator.fetchImports()
      readmeGenerator.buildReadme()
      readmeGenerator.createReadmeFile()
      return
    }

    // Fetch list of adapters
    let adapters: Adapter[] = []

    if (options.all) {
      adapters = shell
        .ls('-A', pathToSources)
        .filter((name) => name !== 'README.md')
        .map((name) => ({ name }))
    } else if (options.adapters?.length) {
      adapters = options.adapters.map((name: string) => ({ name }))
    }

    // Filter list by blacklist
    const blacklist = (getJsonFile(pathToBlacklist) as Blacklist).blacklist
    const adapterInBlacklist = blacklist.reduce((map: BooleanMap, a) => {
      map[a] = true
      return map
    }, {})
    adapters = adapters.filter((a) => !adapterInBlacklist[a.name])

    // Collect new README versions
    const readmeQueue = await Promise.all(
      adapters.map(async (adapter: Adapter) => {
        const readmeGenerator = new ReadmeGenerator(
          pathToSources + adapter.name,
          options.verbose,
          adapter.skipTests,
        )
        await readmeGenerator.fetchImports()
        readmeGenerator.buildReadme()
        return readmeGenerator
      }),
    )

    // Save README files
    for (const generator of readmeQueue) {
      generator.createReadmeFile()
    }
    console.log(`${readmeQueue.length} README(s) generated.`)
    process.exit(0)
  } catch (error) {
    console.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}

main()
