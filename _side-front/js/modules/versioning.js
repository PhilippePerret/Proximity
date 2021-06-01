'use strict';
/**
  Object Versioning
  -----------------
  version 1.0.0

  Pour gérer les versions d'un projet

  Requis
  ------
    * npm install adm-zip
    * npm install glob
    * npm install rimraf
    * npm electron-log

  Usage
  -----
    const Version = require('path/to/versioning.js')
    Version.new(objet[, options])

    Où 'objet' est la chose qu'il faut versionner et qui doit répondre à ces
    exigences :
      - objet.folder      => retourne le path au dossier de l'objet à versionner
                              Où définir 'folder' dans les options envoyées
      - get version()     => retourne la version 'string' (p.e. '1.2.0')
        set version(vers) => définit la nouvelle version
        Note : si Versioning trouve un fichier 'VERSION' dans le dossier de
        l'objet, elle peut le modifier.

  Options
  -------
    :folderVersions   Le dossier, dans l'application, recevant les anciennes
                      versions. Par défaut, c'est 'xversions'
    :folder           Le dossier principal dans lequel trouver les fichiers à
                      traiter.
    :extensions       {Array|String} La liste ou l'extension des fichiers à
                      traiter. P.e. 'json' ou ['json'] traitera tous les fichiers
                      JSON (et seulement les fichiers JSON)
    :excludes         {Array of String} Liste des NOMS de fichiers à exclure,
                      lorsque la définition des fichiers se fait par extension.
                      Chaque élément est le nom du fichier, pas son chemin
                      relatif.
    :files            {Array de String} La liste des fichiers à considérer, si
                      :extensions n'est pas défini. Ce sont les noms ou les
                      chemins relatifs depuis le dossier principal.

  TODO
  ----
    * Pour le moment, ça ne traite que des fichiers. Développer pour que ça
      fonctionne aussi avec des dossiers.
**/

// Pour les messages, simplement, l'entête, le préfixe
const pfx = '[versioning]'

const electron  = require('electron')
const fs        = require('fs')
const path      = require('path')
const remote    = electron.remote
const DIALOG    = remote.dialog
const AdmZip    = require('adm-zip');
const log       = require('electron-log')
log.transports.console.level = 'warn'
const rmrf      = function(fpath,opts){
  return new Promise((ok,ko) => { require('rimraf')(fpath,opts||[],ok) })
};
const glob = function(pattern, options, callback){
  const glob = require('glob')
  if ( undefined === callback && 'function' === typeof options) {
    callback = options ; options  = null
  }
  return new Promise((ok,ko) => {
    glob(pattern, options, (err, files) => {
      if ( err ){ko(err);throw Error(err)}
      else {callback(err, files);ok(files)}
    })
  })
}



module.exports = {
  /**
    @param {Hash} options Cf. ci-dessus
  **/
  async new(objet, options){
    var my = this
    Versioning.o = objet
    options = options || {}
    if ( undefined === options.folder ) options.folder = objet.folder
    Versioning.options = options
    // On regarde si l'objet est valide
    if ( ! Versioning.objetIsValid(objet) ) return
    let newVersion = await Versioning.askForNewVersion()
    if (!newVersion || newVersion == 'Annuler') return
    Versioning.buildVersion(newVersion)
    return newVersion
  }
}

if ( 'function' !== typeof(raise) ) {
  function raise(err){ throw new Error(err) }
}

const Versioning = {
  class: 'Versioning'
, type: 'object'

  /**
    Méthode préliminaire qui s'assure que l'objet (le sujet) est valide
  **/
, objetIsValid(obj){
    try {
      if ( 'undefined' === typeof(UI) ) {
        console.error(`${pfx} La bibliothèque UI est requise.`)
        return false
      }
      if ( undefined === UI.error ) {
        console.error(`${pfx} La bibliothèque UI doit répondre à la méthode 'error'`)
        return false
      }
      obj.version || raise("L'objet à versionner doit posséder une propriété 'version' qui retourne la version")
      this.options.folder || raise("Il faut définir le dossier contenant les fichiers. Soit dans '<objet>.folder', soit dans 'options.folder'.")
      fs.existsSync(this.options.folder) || raise(`Le dossier "${this.options.folder}" est introuvable… Impossible de le versionner.`)
      this.options.extensions || this.options.files || raise("Il faut définir les fichiers à traiter. Soit par l'extension (pe. {options.extensions: 'json'} ou ['json','txt']), soit par la liste explicite de chemins relatifs (noms).")
      return true
    } catch (e) {
      UI.error(`${pfx} ${e.message}`)
      return false
    }
  }

/**
  Méthode qui crée la version +version+

  @param {String} version   La nouvelle version voulue

**/
, async buildVersion(version){
  // console.log("-> Versioning.buildVersion(%s)", version)
  // la version courante
  this.curVersion = String(this.o.version)
  let my = this
      // On trouve le dossier de l'ancienne version (note : ce qu'on appelle
      // l'ancienne version ici, c'est la version courante)
    , folderCurV       = my.versionFolder(my.curVersion)
      // Le dossier pour mettre les fichiers (par défaut, le même que le dossier
      // de version — cette propriété avait été conçue pour FilmAnalyzor ou les
      // fichiers d'analyse devaient être mis dans un autre dossier).
    , folderFiles_oldv  = folderCurV // par défaut le même
      // Le path absolu du zip final.
    , zipPath = path.join(my.folder, `version-${my.curVersion}.zip`)

  var srcPath, dstPath

  log.info(`${pfx} Création d'une nouvelle version de l'analyse courante.`)

  // On construit les dossiers au besoin
  fs.existsSync(folderCurV)      || fs.mkdirSync(folderCurV)
  fs.existsSync(folderCurV)      || raise(`Le dossier '${folderCurV}' devrait avoir été créé.`)
  if ( folderCurV != folderFiles_oldv ) {
    fs.existsSync(folderFiles_oldv) || fs.mkdirSync(folderFiles_oldv)
    fs.existsSync(folderFiles_oldv) || raise(`Le dossier '${folderFiles_oldv}' devrait avoir été créé.`)
  }

  // On doit copier tous les fichiers dans le dossier de la
  // version
  log.info(`${pfx} Copie de tous les fichiers JSON dans le dossier de la version courante`)

  let traitedFilesCount = 0 ;

  // Méthode qui copie le fichier dans le dossier à zipper
  var methodeTraitement = (err, files) => {
    if (err) throw Error(err)
    let exclusions = this.options.excludes || []
    for(srcPath of files){
      var srcName = path.basename(srcPath)
      if ( exclusions.includes(srcName) ) {
        // console.log("Fichier exclu : ", srcName)
        continue
      }
      dstPath = path.join(folderCurV, srcName)
      // console.log("Traitement du fichier '%s' -> '%s' ", srcName, dstPath)
      fs.copyFileSync(srcPath, dstPath)
      ++ traitedFilesCount
    }
  }

  // Déterminer les fichiers à prendre en compte
  var pglob ;
  if ( this.options.extensions ) {
    if ( 'string' === typeof(this.options.extensions) ) {
      // Extension unique, p.e. 'json'
      pglob = `${this.options.folder}/*.${this.options.extensions}`
    } else {
      // Multiples extensions
      pglob = `${this.options.folder}/*.{${this.options.extensions.join(',')}}`
    }
    await glob(pglob, methodeTraitement)
  } else if ( this.options.files ) {
    traitedFilesCount = methodeTraitement.call(null, this.options.files)
  }

  // On vérifie le compte de fichiers traités et obtenus
  // (est-ce vraiment nécessaire ?)
  let count = 0
  await glob(`${folderCurV}/*.*`, (err,files)=>{count = files.length})
  count == traitedFilesCount || raise(`${pfx} Le nombre de fichiers JSON originaux (${traitedFilesCount}) et copiés (${count}) ne correspond pas…`)
  log.info(`${pfx} ${count} fichiers JSON copiés.`)

  await my.buildZipFile(folderCurV, zipPath)

  // Enfin, on change la définition de la version courante
  my.changeVersion(version)
}
/**
  Construction du zip file et suppression du dossier
  de version original
**/
, async buildZipFile(zfolder, zpath){
    log.info(`${pfx} Construction du fichier zip de la version courante.`)
    let zip = new AdmZip()
    zip.addLocalFolder(zfolder)
    zip.writeZip(zpath);
    await rmrf(zfolder)
  }
/**
  Pour changer de version vraiment, si tout s'est bien passé
**/
, changeVersion(newVersion){
  log.info(`${pfx} Création de la nouvelle version (${newVersion})`)
  // On change la valeur de la propriété 'version' dans l'application
  this.o.version = newVersion
  // Si l'application possède un fichier 'VERSION' à sa racine, on le change
  const pversion = path.join(this.options.folder,'VERSION')
  if ( fs.existsSync(pversion) ) {
    const oldVersion = fs.readFileSync(pversion,'utf-8')
    if ( oldVersion === this.curVersion ) {
      // C'est bon, on peut le changer
      fs.writeFileSync(pversion,newVersion)
    }
  }
}
/**
  Méthode qui demande la nouvelle version.
**/
, askForNewVersion(){
    // Les versions possibles
    let [majorV, minorV, revision] = this.o.version.split('.').map(x => Math.round(x))
    let nversions = []
    nversions.push('Annuler')
    nversions.push([majorV + 1, 0, 0].join('.'))
    nversions.push([majorV, minorV+1, 0].join('.'))
    nversions.push([majorV, minorV, revision+1].join('.'))
    let idx_nversion = DIALOG.showMessageBoxSync(null, {
      type: 'question'
    , buttons: nversions
    , title: 'Nouvelle version de l’analyse'
    , message: `Version courante : ${this.o.version}.${RC}Nouvelle version :`
    })
    return nversions[idx_nversion]
  }

, versionFolder(version){
    return path.join(this.folder, version)
  }
, definePathFolder(){
    let p = path.join(this.options.folder,this.options.folderVersions||'xversions')
    fs.existsSync(p) || fs.mkdirSync(p)
    return p
  }
}
Object.defineProperties(Versioning,{
  // Le dossier, dans le dossier de l'application, qui contiendra les
  // différentes versions ('xversions' par défaut)
  folder:{
    get(){
      return this._folder || (this._folder = this.definePathFolder() )
    }
  }
})
