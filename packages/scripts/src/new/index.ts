import { execSync } from 'child_process'
import { gt } from 'semver'
import { generate, writeJson } from './lib'

const FRAMEWORK = '@chainlink/external-adapter-framework@'
const EA_SCRIPTS = '@chainlink/ea-scripts@workspace:packages/scripts'

type WhyRow = { value: string; children: Record<string, unknown> }

function descriptor(childKey: string): string | null {
  return childKey.startsWith(FRAMEWORK) ? childKey.slice(FRAMEWORK.length) : null
}

// Returns highest framework version used in the repo.
// Except it returns the portal version if it's used in ea-scripts.
function getFrameworkVersionSpecFromRepo(): string {
  const out = execSync('yarn why @chainlink/external-adapter-framework --json', {
    encoding: 'utf-8',
  })

  const rows = out
    .trimEnd()
    .split('\n')
    .map((line) => JSON.parse(line.trim()) as WhyRow)

  const eaScripts = rows.find((r) => r.value === EA_SCRIPTS)!

  for (const key of Object.keys(eaScripts.children)) {
    const d = descriptor(key)
    if (d?.startsWith('portal:')) {
      return d
    }
  }

  let max: string | undefined
  for (const row of rows) {
    for (const key of Object.keys(row.children)) {
      const d = descriptor(key)
      if (!d?.startsWith('npm:')) {
        continue
      }
      const v = d.slice('npm:'.length)
      if (max === undefined || gt(v, max)) {
        max = v
      }
    }
  }

  return `npm:${max}`
}

if (process.argv[2] == 'tsconfig') {
  // Update tsconfig files
  generate().then(writeJson)
} else {
  const ADAPTER_TYPES = ['composite', 'source', 'target']

  const type = process.argv[2] || 'source'

  if (!ADAPTER_TYPES.includes(type)) {
    throw new Error(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)
  }
  let path = `packages/sources`
  switch (type) {
    case 'composite': {
      path = 'packages/composites'
      break
    }
    case 'target': {
      path = 'packages/targets'
      break
    }
  }

  execSync(`rm -rf ./.yarn/cache/node_modules`)
  // This should give either something like 'npm:1.2.3' or
  // 'portal:some/local/path:...'
  const frameworkVersion = getFrameworkVersionSpecFromRepo()

  let generatorIndexPath = ''

  if (frameworkVersion.startsWith('portal:')) {
    generatorIndexPath =
      frameworkVersion.split(':')[1] + '/generator-adapter/generators/app/index.js'
  } else if (frameworkVersion.startsWith('npm:')) {
    const result = execSync(
      `find . -name "@chainlink-external-adapter-framework-${frameworkVersion.replace(':', '-')}*"`,
      {
        encoding: 'utf-8',
      },
    )
    execSync(`unzip ${result.trimEnd()} -d ./.yarn/cache`, { maxBuffer: 1024 * 1024 * 500 })

    generatorIndexPath =
      './.yarn/cache/node_modules/@chainlink/external-adapter-framework/generator-adapter/generators/app/index.js'
  } else {
    throw new Error(`Unsupported framework version format: '${frameworkVersion}'`)
  }

  execSync(`npm install -g yo@5.0.0 > /dev/null 2>&1`)

  console.log('Run the following command:')
  console.log(`  yo ${generatorIndexPath} ${path} && yarn new tsconfig`)
}
