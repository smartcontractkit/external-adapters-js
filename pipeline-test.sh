#!/bin/bash -e

git add .github && git commit --amend -m "fixes" && git push -f
git branch -D pipelines-refactor-test || true
git checkout -b pipelines-refactor-test
echo "// test" >> packages/sources/coingecko/src/index.ts
printf '"---\n'@chainlink/coingecko-adapter': patch\n---\n\ntest"' >> .changeset/funny-olives-cover.md
git add packages/sources/coingecko/src/index.ts
git add .changeset/funny-olives-cover.md
git commit -m "Test"
git push origin pipelines-refactor-test -f
git checkout pipelines-refactor