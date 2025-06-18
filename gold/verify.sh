#!/bin/sh
set -e

pnpm build

_error=0

for _fixture in */; do
  _fixture=$(echo $_fixture | sed 's/.$//')
  _read=$(cat "$_fixture/out.au")
  set +e
  _run=$(cd $_fixture && ./run.sh 2>&1)
  set -e
  if [ "$_read" = "$_run" ]; then
    echo "✔ $_fixture"
  else
    _error=1
    echo "✗ $_fixture"
    echo "*** read ***\n$_read\n*** run  ***\n$_run\n***"
  fi
done

exit $_error
