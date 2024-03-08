# Mask Scam List

## Introduction

This repo includes the Mask Network domain warning list which are a source of malware, phishing and spam. 
The warning data from [CryptoScamDB](https://cryptoscamdb.org/).

## Install

```shell
pnpm install
```

## Generate Scam List on Local Machine

```shell
export CRYPTO_SCAM_DB_URL="[url]" && pnpm generate
```

## Generate Scam List on Github Action

Open the actions page and manually dispatch a workflow.