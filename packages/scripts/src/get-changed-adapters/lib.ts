import chalk from 'chalk'
import fs from 'fs'
const { red } = chalk

const usageString = `
Requires 1 argument of the changed files file path.`

/**
 * Checks the args for required input.
 * @returns The inputs from the args.
 */
export const checkArgs = (): string => {
  if (process.argv.length < 3) {
    process.exitCode = 1
    throw red.bold(usageString)
  }
  const file: string = process.argv[2]
  if (!file) {
    process.exitCode = 1
    throw red.bold(usageString)
  }

  return file
}

export interface ChangedAdapters {
  sources: string[]
  composites: string[]
  targets: string[]
  coreWasChanged: boolean
}

export const loadChangedFileList = (file: string): string[] => {
  const fileText = fs.readFileSync(file)
  const changedFiles = fileText.toString().split('\n')
  return changedFiles
}

export const generateFilteredAdaptersListByType = (changedFiles: string[]): ChangedAdapters => {
  // Build lists of unique adapters changed for each type in each file
  const coreChanges = filterFilesToAdapters(changedFiles, 'core')
  const changedAdapters: ChangedAdapters = {
    sources: filterFilesToAdapters(changedFiles, 'sources'),
    composites: filterFilesToAdapters(changedFiles, 'composites'),
    targets: filterFilesToAdapters(changedFiles, 'targets'),
    coreWasChanged: coreChanges.length > 0 ? true : false,
  }
  return changedAdapters
}

const filterFilesToAdapters = (
  changedFiles: string[],
  filterForAdapterType: string,
): string[] => {
  // filter files for specific adapter type
  const changedFilesForType = changedFiles.filter(function (str) {
    return str.includes(`packages/${filterForAdapterType}/`)
  })

  const uniqueAdapters: { [key: string]: boolean } = {}
  for (let i = 0; i < changedFilesForType.length; i++) {
    const line = changedFilesForType[i]
    // remove test files
    if (!line.includes('/src/')) {
      continue
    }

    // load unique adapters into dictionary
    const dirNames = line.split('/')
    uniqueAdapters[dirNames[2]] = true
  }
  // return array of dictionary keys which is all the adapters that have changed
  return Object.keys(uniqueAdapters)
}

export const createOutput = (adapters: ChangedAdapters): string => {
  // TODO if needed do specific things for specific adapters, none yet
  // if needed do specific things for core changes
  if (adapters.coreWasChanged) {
    // TODO add an adapter of each type to the outgoing array to be tested
  }

  // combine adapters lists to create bash usable array of adapters to test
  return [...adapters.sources, ...adapters.composites, ...adapters.targets].join(' ')
}

export async function main(): Promise<void> {
  const file = checkArgs()
  const changedFiles = loadChangedFileList(file)
  const changedAdapters = generateFilteredAdaptersListByType(changedFiles)
  console.log(createOutput(changedAdapters))
}
