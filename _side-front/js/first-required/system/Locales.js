'use strict';
/**
  Locales.js

  Version 1.0.0
  -------------
  # 1.0.0
      Première version fonctionnant entièrement en package (les
      path sont en absolu et fonctionnent, maintenant).
  # 0.3.0
      Version back-side pour être utilisé pour les menus
  # 0.2.1
      Remplacement des retours chariots par des <br>
  # 0.2.0
      Tout est mis dans ce module.
  # 0.1.3
    Définitionss mises dans le dossier locales
    ./_site-front/app/locales/$LANG/data.yaml

**/
const pathBack = require('path')
const fsBack = require('fs')
const YAMLBack = require('js-yaml')

let appBack ;

if ( 'undefined' === typeof (app)){
  const {app} = require('electron')
  appBack = app
} else {
  appBack = app
}

function absolutePath(relPath){
  return pathBack.join(appBack.getAppPath(),relPath)
}

if ( 'undefined' === typeof(window) ) {
  var window = {}
}

function loc(locale_id, params) {
  var dmessage = locale_id.split('.')
  var message = window.TEXT
  var dom ;
  while ( dom = dmessage.shift() ){
    if ( 'string' === typeof message ) message = {[dom]: `${message}.${dom}`}
    message = message[dom] || dom
  }
  message || raise(loc('error.dialog.message.unfound',{locale:locale_id}))
  message = message.replace(/\n/g,'<br>')
  if ( params ) {
    for(var k in params){
      var reg = new RegExp(`\\\$\\\{${k}\\\}`, 'g')
      message = message.replace(reg, params[k])
    }
  }
  return message
}
function defineLocales(lang){
  lang = lang || 'fr_FR.UTF-8'
  window.LANG = lang.substring(0,2)
  var locales = {}
  for(var bi of ['system', 'app']){
    var p = absolutePath(`_side-front/locales/${bi}/${window.LANG}/locales.yaml`)
    var p_en = absolutePath(`./_side-front/locales/${bi}/en/locales.yaml`)
    // console.log("appBack.getAppPath() = ", appBack.getAppPath())
    fsBack.existsSync(p) || (p = p_en)
    fsBack.existsSync(p) && Object.assign(locales,YAMLBack.safeLoad(fsBack.readFileSync(p,'utf8')))
  }
  window.TEXT = locales
}
defineLocales(process.env.LANG)
// console.log("window.LANG = ", window.LANG)
// console.log("TEXT = ", TEXT)

// Pour les menus par exemple
module.exports = loc
