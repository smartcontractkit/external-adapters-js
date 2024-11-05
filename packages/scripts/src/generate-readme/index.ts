import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { Blacklist, BooleanMap } from '../shared/docGenTypes'
import { getJsonFile } from '../shared/docGenUtils'
import { getWorkspaceAdapters, getWorkspacePackages } from '../workspace'
import { ReadmeGenerator } from './generator'

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

    const shouldBuildAll =
      options.all ||
      getWorkspacePackages(process.env['UPSTREAM_BRANCH']).find(
        (p) => p.type === 'core' || p.type === 'scripts',
      )

    let adapters = shouldBuildAll
      ? getWorkspaceAdapters()
      : getWorkspaceAdapters([], process.env['UPSTREAM_BRANCH'])

    // Test setting
    if (options.testPath) {
      const adapter = adapters.find((a) => a.location === options.testPath)
      if (!adapter) {
        console.error(`Adapter at ${options.testPath} was not found`)
        return
      }
      const readmeGenerator = new ReadmeGenerator(adapter, options.verbose)
      await readmeGenerator.loadAdapterContent()
      readmeGenerator.buildReadme()
      readmeGenerator.createReadmeFile()
      return
    }

    options.verbose &&
      console.log(
        `Adapters being considered for readme generation: `,
        adapters.map((a) => `${a.name}: ${a.location}`),
      )

    const initialAdapterLength = adapters.length

    // If specific adapters are passed to the command line, only select those
    if (options.adapters?.length) {
      options.verbose &&
        console.log(`Reducing list of adapters to ones specified on the command line`)
      adapters = adapters.filter((p) => {
        return (
          (options.adapters as string[]).includes(p.descopedName) || // p.descopedName example: "coinbase-adapter"
          (options.adapters as string[]).includes(p.descopedName.replace(/-adapter$/, '')) // "coinbase" (without "-adapter")
        )
      })
    }

    const blacklist = (getJsonFile(pathToBlacklist) as Blacklist).blacklist
    const adapterInBlacklist = blacklist.reduce((map: BooleanMap, a) => {
      const adapterName = `@chainlink/${a}-adapter`
      map[adapterName] = true
      return map
    }, {})
    options.verbose && console.log(`Removing blacklisted and non-source adapters from the list`)
    adapters = adapters
      .filter((a) => !adapterInBlacklist[a.name]) // Remove blacklisted adapters
      .filter((p) => p.type === 'sources' || p.type === 'composites') // Remove non-source and non-composite adapters

    options.verbose &&
      console.log(`Filtered ${initialAdapterLength - adapters.length} adapters from the list`) // Verbose because this message is confusing if you're not familiar with generate-readme
    console.log(
      'Generating README(s) for the following adapters: ',
      adapters.map((a) => a.name),
    )

    // Collect new README versions
    const readmeQueue = await Promise.all(
      adapters.map(async (adapter) => {
        const readmeGenerator = new ReadmeGenerator(adapter, options.verbose)
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
