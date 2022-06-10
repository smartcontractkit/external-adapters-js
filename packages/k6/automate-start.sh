#!/bin/bash

# Set up the mock API
cd "$MOCK_API_DIR" && yarn && cd -
echo "{}" > "${MOCK_API_DIR}"/responses.json

adapterNames=()
for var in "$@"
do
  adapter=$(echo "$var" | cut -d : -f 1)
  printf -v name "%s-adapter" "$adapter"
  adapterNames+=("$name")
done

# Start mock APIs and adapters on ports 9080 and 8080, respectively, and increment from there
mockApiListenPort=9080
adapterListenPort=8080

for var in "$@"
do
  adapter=$(echo "$var" | cut -d : -f 1)
  version=$(echo "$var" | cut -d : -f 2)

  # Run the mock API
  printf -v envDpSourceUrl "%s_DATA_SOURCE_URL" "$adapter"
  cd "$MOCK_API_DIR" && env SOURCE_URL="${!envDpSourceUrl}" PORT="$mockApiListenPort" yarn start &

  # Run the EA
  printf -v adapterName "%s-adapter" "$adapter"
  printf -v ecrPath "public.ecr.aws/chainlink/adapters/%s-adapter:%s" "$adapter" "$version"
  printf -v mockApiEndpoint "http://localhost:%d" "$mockApiListenPort"
  printf -v envFileName "%s.env" "$adapter"

  docker run --network host --env-file="$envFileName" --rm -d -e API_ENDPOINT="$mockApiEndpoint" -e EA_PORT="$adapterListenPort" --name "$adapterName" "$ecrPath"

  # Increment port numbers
  ((mockApiListenPort+=1))
  ((adapterListenPort+=1))
done

# Add a sleep to allow for the mock API to finish starting up
sleep 1

# Output the run command on the k6 side
echo "Adapters are running. Stop with Ctrl+C"
echo "You can now run the following command on the k6 instance:"

# TODO: Needs to be switched out with the proper run command in ticket sc-42715
OUTPUT="yarn run whatever"
i=0
for var in "$@"
do
  port=$((8080+"$i"))
  adapter=$(echo "$var" | cut -d : -f 1)
  printf -v adapterOutput " %s:%d" "$adapter" "$port"
  OUTPUT+=$adapterOutput
  ((i+=1))
done

echo "$OUTPUT"

sleep infinity & PID=$!
trap 'kill $PID' INT TERM

wait

echo "Stopping..."

# Stop the docker containers. No rm needed here because we ran them with the --rm flag!
docker stop "${adapterNames[@]}"

exit 0
