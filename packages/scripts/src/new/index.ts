import { execSync } from 'child_process'
import { generate, writeJson } from './lib'

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
  const frameworkVersion = execSync(
    `yarn --cwd packages/scripts info @chainlink/external-adapter-framework --json | jq -r '.value'`,
    {
      encoding: 'utf-8',
    },
  )
    .trim()
    .split('@')[2]

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
