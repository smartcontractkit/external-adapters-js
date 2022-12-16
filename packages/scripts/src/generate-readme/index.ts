import * as shell from 'shelljs'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { Adapter, Blacklist, BooleanMap } from '../shared/docGenTypes'
import { getJsonFile } from '../shared/docGenUtils'
import { ReadmeGenerator } from './generator'
import { EOL } from 'os'
import { getWorkspacePackages } from '../workspace'

const pathToBlacklist = 'packages/scripts/src/generate-readme/readmeBlacklist.json'

const findTypeAndName = new RegExp(
  // For example, packages/(sources)/(coinbase)
  /packages\/(sources|composites|examples|targets|non-deployable)\/(.*)/,
)
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

    // Test setting
    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath, options.verbose)
      await readmeGenerator.loadAdapterContent()
      readmeGenerator.buildReadme()
      readmeGenerator.createReadmeFile()
      return
    }

    let adapters = options.all
      ? getWorkspacePackages()
      : getWorkspacePackages([], process.env['UPSTREAM_BRANCH'])

    // If all isn't passed, but some core or script package has changed, build all
    // Legos will always change because it depends on all adapters, so ignore it when considering if we need to build all
    if (
      !options.all &&
      adapters.find(
        (p) => (p.type === 'core' && !p.location.includes('legos')) || p.type === 'scripts',
      )
    ) {
      console.log('Changes to core or scripts detected, generating READMEs for all adapters')
      adapters = getWorkspacePackages() //Unfiltered list of all adapters when core or scripts are changed
    }

    // If specific adapters are passed to the command line
    if (options.adapters?.length) {
      adapters = adapters.filter((p) => {
        return (
          (options.adapters as string[]).includes(p.descopedName) || // p.descopedName example: "coinbase-adapter"
          (options.adapters as string[]).includes(p.descopedName.replace(/-adapter$/, '')) // "coinbase" (without "-adapter")
        )
      })
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
        const readmeGenerator = new ReadmeGenerator(adapter, options.verbose, adapter.skipTests)
        await readmeGenerator.loadAdapterContent()
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
