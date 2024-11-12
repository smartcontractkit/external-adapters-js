#!/bin/bash

# Build, so we'll have a dist directory to load files into
yarn build

# Set up the mock API
if [ -z $MOCK_API_DIR ]; then
  echo "MOCK_API_DIR not set, please refer to README for instructions on how to populate this var"
  exit 1
fi

(cd "$MOCK_API_DIR" && \
  echo "{}" > "${MOCK_API_DIR}"/responses.json && \
  docker image build -t external-adapters-tooling/mock-api .)

# Make sure the payloads config directory exists since we'll be copying payloads from tooling into it
if [[ ! -d ./src/config/payloads ]]; then
    mkdir -p ./src/config/payloads
fi


for var in "$@"
do

  adapterName=$(echo "$var" | cut -d : -f 1)
  version=$(echo "$var" | cut -d : -f 2)
  printf -v adapterNameWithSuffix "%s-adapter" "$adapterName"
  printf -v mockApiName "%s-mock-api" "$adapterName"
  printf -v networkName "%s-network" "$adapterName"
  echo "Initializing $adapter:$version..."

  echo "Cleaning artifacts from previous runs if they exist..."
  docker container stop $adapterNameWithSuffix
  docker container stop $mockApiName
  docker network rm $networkName

  # Set up the bridge network for our mock API, EA, and k6 test, which will let us avoid port collisions
  docker network create -d bridge $networkName

  # Go to MOCK_API_DIR (Ex: external-adapters-tooling/mock-api) and start the mock API container
  printf -v envDpSourceUrl "%s_DATA_SOURCE_URL" "$adapterName"
  (cd "$MOCK_API_DIR" && \
    docker run --network=$networkName --rm -d -e SOURCE_URL="${!envDpSourceUrl}" -e PORT="9080" --name "$mockApiName" external-adapters-tooling/mock-api)

  # Generate the payload for the adapter, then copy it to a local staging directory (./src/config/payloads)
  yarn qa:flux:configure k6payload ${adapterName} empty.json
  cp src/config/http.json "src/config/payloads/$adapterName-http.json" #Copy payload created by flux locally so we can use it for k6 without importing functions from scripts/flux-emulator

  # Build the docker command we'll use to start the adapter
  printf -v image "public.ecr.aws/chainlink/adapters/%s:%s" "$adapterNameWithSuffix" "$version"
  printf -v mockApiEndpoint "http://%s:%d" "$mockApiName" "9080"
  printf -v envFileName "./%s.env" "$adapterName" #Adapter specific configuration
  if [[ -f "$envFileName" ]]; then
    docker run --network="$networkName" --rm -d -e API_ENDPOINT="$mockApiEndpoint" -e EA_PORT="8080" --env-file="$envFileName" --name "$adapterNameWithSuffix" "$image"
  else
    docker run --network="$networkName" --rm -d -e API_ENDPOINT="$mockApiEndpoint" -e EA_PORT="8080" --name "$adapterNameWithSuffix" "$image"
  fi
done

# Add a sleep to allow for the mock API to finish starting up
sleep 1



# generate a list of names to manipulate docker when the container exits
adapterNameWithSuffixes=()
mockApis=()
bridgeNetworks=()
for var in "$@"
do
  adapter=$(echo "$var" | cut -d : -f 1)
  adapterNames+=("$adapter")
  adapterNameWithSuffixes+=("$adapter-adapter")
  mockApis+=("$adapter-mock-api")
  bridgeNetworks+=("$adapter-network")
done

# Output the run command on the k6 side
echo "Adapters are running. Stop with Ctrl+C"
echo "You can now run the following command on the k6 instance:"
echo "yarn test:limit$(printf " %s" "${adapterNames[@]}")"
echo "Press ctrl+c to stop the adapters and mock APIs"
tail -f /dev/null & #Background process to run for infinity
sleep infinity & PID=$!
trap 'kill $PID' INT TERM

wait

echo "Stopping..."

# Stop the docker containers. No rm needed here because we ran them with the --rm flag!
docker stop "${adapterNameWithSuffixes[@]}"
docker stop "${mockApis[@]}"

# Remove the bridge networks we created
docker network rm "${bridgeNetworks[@]}"

exit 0
