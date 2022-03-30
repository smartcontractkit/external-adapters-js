import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { saveAdapterDependencies } from './lib'

export async function main(): Promise<void | string> {
  try {
    const commandLineOptions = [
      {
        name: 'adapters',
        alias: 'a',
        multiple: true,
        defaultOption: true,
        description: 'Adapters to save dependencies for',
      },
      {
        name: 'file',
        alias: 'f',
        type: String,
        default: './packages/scripts/src/adapter-dependencies/dependencies.txt',
        description: 'Where to save the adapter dependencies',
      },
      {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: 'Display usage guide',
      },
    ]
    const options = commandLineArgs(commandLineOptions)

    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Adapter Dependencies Script',
          content:
            'This script is run from the root of the external-adapter-js/ repo to save the adapter dependencies for a set of adapters.',
        },
        {
          header: 'Options',
          optionList: commandLineOptions,
        },
        {
          content:
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-\njs/packages/scripts/src/adapter-dependencies/}',
        },
      ])
      console.log(usage)
      return
    }

    await saveAdapterDependencies(options.adapters, options.file)

    process.exit(0)
  } catch (error) {
    console.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}

main()
