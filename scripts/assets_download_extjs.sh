#!/usr/bin/env bash

_VERSION=$1

if [[ "${_VERSION}" == "" ]]; then
    _VERSION=6.2.0
fi

echo "Creating temp folder..."
mkdir -p ./tmp > /dev/null 2>&1
pushd ./tmp > /dev/null 2>&1
echo "Downloading ExtJS ${_VERSION}-gpl SDK..."
wget -qO- --show-progress http://cdn.sencha.com/ext/gpl/ext-${_VERSION}-gpl.zip | busybox unzip -q - 2>&1
popd > /dev/null 2>&1
echo "Moving downloaded ExtJS to app folder..."
mv ./tmp/ext-${_VERSION} ./assets/ext
echo "Removing temp folder..."
rm -rf ./tmp > /dev/null 2>&1

echo "Success"
exit 0
