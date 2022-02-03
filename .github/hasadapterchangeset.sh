#!/bin/bash
echo "=============== list modified files ==============="
git diff --name-only HEAD^ HEAD

echo "========== check paths of modified files =========="
git diff --name-only HEAD^ HEAD > files.txt
echo "::set-output name=has_adapter_change::false"
echo "::set-output name=has_changeset::false"

while IFS= read -r file
do
echo $file
if [[ $file == packages/sources/*/src/* || $file == packages/composites/*/src/* || $file == packages/targets/*/src/* ]]; then
    echo "This PR contains an adapter src code change."
    echo "::set-output name=has_adapter_change::true"
fi

if [[ $file == .changeset/* ]]; then
    echo "This PR contains a changeset file."
    echo "::set-output name=has_changeset::true"
fi
done < files.txt