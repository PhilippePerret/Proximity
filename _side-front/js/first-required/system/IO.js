'use strict'

const JSONStream = require('JSONStream')
/**
  Pour les paths et les entrées sorties
**/

const IO = {
  name: 'IO'

  /**
    Méthode qui permet d'enregistrer un flot conséquent d'informations.

    ::forEach   Méthode de classe de l'objet +objet+ qui doit boucler sur chaque
                instance de l'objet +objet+
    #forJSON    Méthode d'instance qui doit retourner une table des données pour
                l'enregistrement. Cette méthode, par exemple, peut remplacer les
                clés longues par de simples lettres.
    ::reset()   Méthode de classe de l'objet +objet+ qui remet à zéro l'objet,
                notamment ses items et son pointeur
    @async
  **/
, saveLargeJSONData(objet, fpath) {
    console.log("-> IO.saveLargeJSONData")
    return new Promise((ok,ko) => {
      var transStream   = JSONStream.stringify()
      var outputStream  = fs.createWriteStream(fpath)
      transStream.pipe( outputStream )
      var preferedMethod = 'forEachItem'
      if ( ! (objet[preferedMethod] instanceof Function) ) {
        preferedMethod = 'forEach'
      }
      objet[preferedMethod]( item => {
        // console.log("Écriture de l'item", item)
        transStream.write(item.forJSON)
      })
      // objet[proprerty].forEach( transStream.write )
      transStream.end()
      outputStream
        .on('finish', function handlerFinis(){
          console.log("   <- fin saveLargeJSONData(%s)", fpath)
          ok()
        })
        .on('error', (err) => {
          console.error(err)
          ko()
        })
    })
  }

  /**
    Sauver +data+ au format JSON
  **/
, saveJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data))
  }

  /**
    Lire les données JSON du fichier +path+ et les retourner
  **/
, loadJSON(path){
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
  }

  /**
    Chargement d'un gros fichier JSON
    +objet+ doit définir :
      - la méthode `fromJSONFile` qui va recevoir tous les
        chunk de données lues.
      - la méthode `onEndLoadJSONFile` qui sera appelée une fois toutes les
        données chargées. Sauf si +callback+ est définie.
    +callback+ doit définir la méthode qui sera appelée
    Définir objet.afterLoadingData(ok) si une méthode doit être appelée
    après le chargement.
    @async
  **/
, loadLargeJSONData(objet, pth, callback){
    return new Promise((ok,ko) => {
      var transStream = JSONStream.parse( "*" )
      var inputStream = fs.createReadStream(pth)
      inputStream
        .pipe(transStream)
        .on('data', function handleRecord(data){
          objet.fromJSONFile(data)
          // console.log("J'ai lu la donnée ", data)
        })
        .on('end', function handleEndReading(){
          // console.log("J'ai fini de charger le fichier ", pth)
          if ( callback instanceof Function ) {
            callback.call(ok)
          } else if (objet.onEndLoadJSONFile instanceof Function ){
            objet.onEndLoadJSONFile.call(objet, ok)
          } else {
            ok()
          }
        })
    })
  }

, saveSync(fpath, value) {
    return fs.writeFileSync(fpath, value)
  }

, loadSync(fpath) {
    return fs.readFileSync(fpath, 'utf-8')
  }
  // Pour obtenir le path absolu d'un élement de l'application
, pathOf(relpath){return path.join(this.appFolder, relpath)}

, get appFolder(){
    return this._appfolder || (this._appfolder = remote.app.getAppPath())
  }

  /**
    Méthode qui permet de choisir un fichier, un dossier, etc. en fonction
    des paramètres +params+ transmis.

    params:
      message: Le message d'action sur la fenêtre
      folder:   true/false    Si true, on peut choisir un dossier
      create:   true/false    Si true, on peut créer un dossier
      file:     true/false    Si true, on peut choisir un fichier
      multi:    true/false    Si true, on peut en choisir plusieurs
      defaultPath:  Le chemin d'accès par défaut (le gérer dans l'application)
      button:   Le nom du bouton de choix

      Par défaut :
        - Le message est "Choisir…"
        - on demande un fichier, pas un dossier
        - on peut créer un dossier

  **/
, choose(params){
    params = params || {}
    var props = []
    if ( !params.folder && !params.file ) params.file = true
    params.folder && props.push('openDirectory')
    params.file   && props.push('openFile')
    params.create === false || props.push('createDirectory')

    let openOptions = {
        message:      params.message || "Choisir…"
      , properties:   props
      , buttonLabel:  params.button || "Ouvrir"
    }

    if ( params.file ) {
      params.extensions || (params.extensions = [{name:'Tous les fichiers', extensions:['txt']}])
      Object.assign(openOptions,{filters: params.extensions})
    }

    params.defaultPath && Object.assign(openOptions,{defaultPath:params.defaultPath})

    // On présente la fenêtre à l'utilisateur
    let files = Dialog.showOpenDialogSync(openOptions)
    // console.log("files: ", files)
    if (!files) return false
    return files
  }

}
