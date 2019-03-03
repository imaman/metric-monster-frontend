#!/bin/bash

set -e

this_dir=`dirname $(readlink -f $0)`
src_dir=$this_dir/dist
dst_dir=_SET_TO_A_DIR_OF_GITHUB_IO_

echo "you must set dst_dir"
exit 1


cd "$this_dir"

npm run build



rm -rf "$dst_dir"
mkdir "$dst_dir"

cp -r $src_dir/* "$dst_dir"

cd "$dst_dir/.."
git add .
git commit -m "deploy"
git push


