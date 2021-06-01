'use strict'

const path  = require('path')
const fs    = require('fs')
const {app} = require('electron')
const glob  = require('glob')

// const App = require(path.join(__dirname, 'App'))
const App = require('./App')

/**
  Fichier principal du main-process
  Tous les fichiers dans ce dossier seront automatiquement chargés.
**/

global.MainBuild = {
  /**
    Méthode qui construit le fichier _site-front/main.html avec toutes les
    balise css et script requises.
    Sans faire ça, l'application packagée ne les comprend pas.
  **/
  build(){
    this.buildJSTags()
    this.buildCSSTags()
    let code = fs.readFileSync(this.mainHtmlTemplatePath,'utf-8')
    code = code
      .replace(/__CSS__/, this.CSSTags.join("\n"))
      .replace(/__SCRIPTS__/, this.JSTags.join("\n"))
      .replace(/__MARK_TESTS__/, `<script type="text/javascript">const TESTS=${TESTS_ON?'{tests:[]}':'null'};</script>`)
      .replace(/__ProductName__/g, App.getProductName())
    if (code.match('jquery') && code.match('jquery-ui')){
      // Si les scripts inclus jquery et jquery-ui, il faut ajouter une
      // balise pour ne pas produire d'erreur sur jquery-ui qui ne connaitrait
      // pas jQuery.
      var found = code.match(/(src="(.*?)jquery(.*?)"(.*?)<\/script>)/)
      var idx = found.index + found[0].length
      code =
        code.substring(0, idx) +
        "\n<script>window.$ = window.jQuery = require('jquery');</script>" +
        code.substring(idx+1, code.length)
    }
    fs.writeFileSync(this.mainHtmlPath, code)
  }

, buildJSTags(){
    this.JSTags = []
    let folders = ['first-required', 'then-required']
    if ( TESTS_ON ) folders.push('tests')
    for ( var relative of folders ){
      this.buildJSTagsOfFolder(this.pathOf(`_side-front/js/${relative}`))
    }
  }
, buildCSSTags(){
    this.CSSTags = []
    this.buildCSSTagsOfFolder(this.pathOf('_side-front/css'))
  }

, buildJSTagsOfFolder(folder){
    let files = this.filesOfFolder(folder,'js')
    files.forEach( file => this.JSTags.push(this.buildTag(file,'js')))
  }

, buildCSSTagsOfFolder(folder){
    let files = this.filesOfFolder(folder,'css')
    files.forEach( file => this.CSSTags.push(this.buildTag(file,'css')))
  }

, filesOfFolder(folder, tag){
    return glob.sync(`${folder}/**/*.${tag}`)
  }

, buildTag(path, tag){
    path = path.replace(this.appFolder+'/_side-front/','')
    var id = 'stylesheet_' + path.replace(/\//g,'_')
                  .replace(/_+/g,'_')
                  .replace(/^(css|js)_/,'')
                  .replace(/\.(css|js)$/,'')
    if ( tag == 'js' ) {
      return `<script type="text/javascript" src="${path}" id="${id}"></script>`
    } else {
      return `<link rel="stylesheet" href="${path}" id="${id}" />`
    }
  }

, pathOf(relpath){
    return path.join(this.appFolder,relpath)
  }
}
Object.defineProperties(MainBuild,{
  mainHtmlPath:{get(){return this.pathOf('_side-front/main.html')}}
, mainHtmlTemplatePath:{get(){return this.pathOf('_side-front/main-template.html')}}
, cssFolder:{get(){return this.pathOf('_side-front/css')}}
, jsFolder:{get(){return this.pathOf('_side-front/js')}}
, appFolder:{get(){return this._appfolder || (this._appfolder = app.getAppPath())}}
})
