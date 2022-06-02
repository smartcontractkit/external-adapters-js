#!/bin/bash

#set -e

# Set up the mock API
cd "$MOCK_API_DIR" && yarn && cd -
echo "{}" > "${MOCK_API_DIR}"/responses.json

adapterNames=()
for var in "$@"
do
  printf -v name "%s-adapter" "$var"
  adapterNames+=("$name")
done

# Start mock APIs and adapters on ports 9080 and 8080, respectively, and increment from there
mockApiListenPort=9080
adapterListenPort=8080

for var in "$@"
do
  # Run the mock API
  printf -v envDpSourceUrl "%s_SOURCE_URL" "$var"
  cd "$MOCK_API_DIR" && env SOURCE_URL="${!envDpSourceUrl}" PORT="$mockApiListenPort" yarn start &

  # Run the EA
  printf -v adapterName "%s-adapter" "$var"
  printf -v mockApiEndpoint "host.docker.internal:%d" "$mockApiListenPort"
  printf -v envFileName "%s.env" "$var"
  docker-compose --env-file="$envFileName" -f ./../../docker-compose.generated.yaml run -d -p "$adapterListenPort":8080 -e API_ENDPOINT="$mockApiEndpoint" --name "$adapterName" "$adapterName"

  # Increment port numbers
  ((mockApiListenPort+=1))
  ((adapterListenPort+=1))
done

# Output the run command on the k6 side
echo "Adapters are running. Stop with Ctrl+C"
echo "You can now run the following command on the k6 instance:"

OUTPUT="yarn run whatever"
i=0
for var in "$@"
do
  port=$((8080+"$i"))
  printf -v adapterOutput " %s:%d" "$var" "$port"
  OUTPUT+=$adapterOutput
  ((i+=1))
done

echo "$OUTPUT"

sleep infinity & PID=$!
trap 'kill $PID' INT TERM

wait

echo "Stopping..."

docker stop "${adapterNames[@]}" && docker rm "${adapterNames[@]}"

exit 0
