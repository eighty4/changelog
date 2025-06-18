#!/bin/sh
set -e

pnpm build

for _fixture in */; do
  _fixture=$(echo $_fixture | sed 's/.$//')
  set +e
  (cd $_fixture && ./run.sh) > "$_fixture/out.au" 2>&1
  set -e
  echo "*** $_fixture ***"
  cat "$_fixture/out.au"
done
