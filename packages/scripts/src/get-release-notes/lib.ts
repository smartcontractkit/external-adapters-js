import { getWorkspacePackages } from '../workspace'
import { readFileSync, readdirSync } from 'fs'

const CHANGESET_DIRECTORY = '.changeset'

interface changelog {
  major: Set<string>
  minor: Set<string>
  patch: Set<string>
}

export function getReleaseNotes(): string {
  const changelog: changelog = {
    major: new Set(),
    minor: new Set(),
    patch: new Set(),
  }
  const changedAdapterSet: Set<string> = new Set()

  const changesetFileDirs = getChangesetFileDirs()
  changesetFileDirs.map((fileDir) => {
    const fileContents = readFileSync(fileDir, 'utf-8').split('\n')
    const changeSummary = fileContents[fileContents.length - 2]
    const changedAdapters = fileContents.filter((line) => line.indexOf('@chainlink') !== -1)

    changedAdapters.map((line) => {
      const adapterNameDirty = line.match(/'@chainlink\/.+'/)
      const adapterName = adapterNameDirty ? adapterNameDirty[0].replace(/'/g, '') : ''
      changedAdapterSet.add(adapterName)
      const changeType = line.substring(line.length - 5) || ''
      changelog[changeType as keyof typeof changelog].add(changeSummary)
    })
  })

  const major = getChangelogMarkdown(changelog.major)
  const minor = getChangelogMarkdown(changelog.minor)
  const patch = getChangelogMarkdown(changelog.patch)

  let output = `
  # Changeset
  ## Breaking changes (major)
  ${major}
  ## Features (minor)
  ${minor}
  ## Bug fixes (patch)
  ${patch}\n\n`.replace(/  +/g, '')

  const workspacePackages = getWorkspacePackages(['core'])
  if (changedAdapterSet.size > 0) {
    output += `|    Adapter    | Version |\n`
    output += `| :-----------: | :-----: |\n`
    for (const item of changedAdapterSet) {
      workspacePackages
        .filter((pkg) => pkg.name === item)
        .map((changedPkg) => {
          output += `| ${changedPkg.name} | ${changedPkg.version} |\n`
        })
    }
  }

  console.log(output)
  return output
}

function getChangesetFileDirs() {
  return readdirSync(CHANGESET_DIRECTORY)
    .filter((fn) => {
      return fn.endsWith('.md') && fn !== 'README.md'
    })
    .map((filename) => {
      return `${CHANGESET_DIRECTORY}/${filename}`
    })
}

function getChangelogMarkdown(changelogSet: Set<string>) {
  return Array.from(changelogSet)
    .map((change) => `- ${change}`)
    .join('\n')
}
