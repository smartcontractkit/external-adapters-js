import * as shell from 'shelljs'
import { Logger } from '@chainlink/ea-bootstrap'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { Adapter, Blacklist, BooleanMap, JsonObject, MappedAdapters } from './types'

import { ReadmeGenerator, genSigGrep } from './generator'

const pathToBlacklist = 'packages/scripts/src/generate-readme/readmeBlacklist.json'

const pathToSources = 'packages/sources/'

const getJsonFile = (path: string): JsonObject => JSON.parse(shell.cat(path).toString())

const createReadmeFile = (adapterPath: string, readmeText: string, stage?: boolean): void => {
  const readmePath = adapterPath + 'README.md'

  const shellString = new shell.ShellString(readmeText)
  shellString.to(readmePath)

  if (stage) shell.exec(`git add ${readmePath}`)
}

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
        name: 'stage',
        alias: 's',
        type: Boolean,
        description:
          'Generate READMEs for staged file paths and stage the changes (used for pre-commit hook)',
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
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-js/packages/scripts/src/generate-readme/ }',
        },
      ])
      console.log(usage)
      return
    }

    Logger.info({ msg: 'Generating READMEs' })

    // Test setting
    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath, options.verbose)
      await readmeGenerator.fetchImports()

      createReadmeFile(readmeGenerator.getAdapterPath(), readmeGenerator.getReadme())
      return
    }

    // Fetch list of adapters
    let adapters: Adapter[] = []

    if (options.all) {
      adapters = shell
        .ls('-A', pathToSources)
        .filter((name) => name !== 'README.md')
        .map((name) => ({ name }))
    } else if (options.stage) {
      const stagedFiles = shell
        .exec('git diff --name-only --cached', {
          fatal: true,
          silent: true,
        })
        .toString()
        .split('\n')

      const mappedAdapters: MappedAdapters = stagedFiles.reduce(
        (map: MappedAdapters, file: string) => {
          const filePath = file.split('/')
          if (filePath[1] === 'sources') {
            const name = filePath[2]
            if (!map[name]) {
              const readmePath = filePath.slice(0, 3).join('/') + '/README.md'
              map[name] = {
                readmeIsGenerated: shell.cat(readmePath).toString()?.match(genSigGrep)?.length > 0,
              }
            }

            if (filePath.slice(3, 5).join('/') === 'test/integration') {
              map[name].testsUpdated = true
            } else if (filePath.slice(3, 6).join('/') === 'src/endpoint/index.ts') {
              map[name].endpointIndexUpdated = true
            }
          }
          return map
        },
        {},
      )

      adapters = Object.keys(mappedAdapters).map((name) => {
        const options = mappedAdapters[name]
        const skipTests =
          options.readmeIsGenerated && !options?.testsUpdated && !options?.endpointIndexUpdated
        return { name, skipTests }
      })
    } else if (options.adapters?.length) {
      adapters = options.adapters.map((name) => ({ name }))
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
        return [readmeGenerator.getAdapterPath(), readmeGenerator.getReadme()]
      }),
    )

    // Save README files
    for (const adapter of readmeQueue) {
      createReadmeFile(adapter[0], adapter[1], options.stage)
    }
    Logger.info({ msg: `${readmeQueue.length} README(s) generated.` })
    process.exit(0)
  } catch (error) {
    Logger.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}

main()
