#!/bin/sh
# This is a utility script that will attempt to clean up containers created by automate-start.sh

for var in "$@"
do
   adapterName=$(echo "$var" | cut -d : -f 1)
  echo "Attempting to purge containers created for $adapterName"

  echo "Attempting to purge $adapterName"
   docker container rm "$adapterName-adapter"
   docker container rm "$adapterName-mock-api"
   docker network rm "$adapterName-network"
done

