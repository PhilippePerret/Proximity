'use strict'

const path      = require('path')
const fs        = require('fs')
const glob      = require('glob')
const {app}     = require('electron').remote
const exec      = require('child_process').exec
const execSync  = require('child_process').execSync
const execFileS = require('child_process').execFileSync
const execFile  = require('child_process').execFile
const YAML      = require('js-yaml')

const {clipboard} = require('electron')
const remote    = require('electron').remote
const Dialog    = remote.dialog
const log       = require('electron-log')
// Les messages s'afficheront dans la console quand ils atteindront le niveau
// 'warn' (console.warn("<gros problème>"))
log.transports.console.level = 'warn'

const ReadLine = require('readline')

window.onerror = function(err, url, line){
  alert("Une erreur est survenue : " + err + "\n\nConsulter la console (ALT+CMD+i) pour le détail.")
  console.log("# ERREUR :", err, url, line)
}
