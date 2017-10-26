#!/usr/bin/env node

'use strict'

const nopt = require('nopt')
const help = require('help')()
const knownOpts = {
  help: Boolean
, version: Boolean
, source: String
, target: String
, 'exclude-label': String
, 'filter-release': Boolean
}
const shortHand = {
  h: ['--help']
, v: ['--version']
, s: ['--source']
, t: ['--target']
, e: ['--exclude-label']
}
const parsed = nopt(knownOpts, shortHand)

if (parsed.help) {
  return help()
}

if (parsed.version) {
  const {version} = require('../package')
  console.error('node-backport', `v${version}`)
  return
}

const BP = require('../')

const bp = new BP(parsed)

bp.run((err) => {
  if (err) {
    console.error(err)
    process.exitCode = 1
    return
  }

  console.log('backport complete')
})
