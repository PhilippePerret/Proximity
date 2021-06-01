'use strict';

const Test = require('./Test.js')

class YAMLTest {
  /** ---------------------------------------------------------------------
    *   Un fichier YAML définissant le test
    *
    Note : il doit être accompagné d'un fichier '.txt' contenant le
    texte proprement dit.
  *** --------------------------------------------------------------------- */
  constructor(pth){
    // console.log("-> constructor avec", pth)
    this.path = pth

    this.test = this.test.bind(this)
  }

  /**
    Méthode appelée pour jouer le test
  **/
  run(){
    const my = this
    return new Promise((ok,ko)=>{
      try {
        my.applyConfig()
        if ( my.removeProxFolderIfNecessaire() ){
          // console.log("Je vais jouer le test ", my.path)
          // console.log("Ses données : ", my.data)
          // On ouvre le texte
          TConsole.func("Ouverture de "+my.textRelPath)
          PTexte.openAsync(my.textPath).then(my.test).then(ok)
        } else {
          throw new Error("Impossible de détruire le dossier prox actuel du test", my.path)
        }
      } catch (err) { ko(err) }
    })
  }

  /**
    Une fois que le fichier est prêt, on peut lancer véritablement
    le test.
  **/
  test(){
    return (new Test(this)).run()
  }

  /**
    Appliquer les configurations définies pour ce texte
  **/
  applyConfig(){
    if ( undefined === this.config ) return
    // Autosave désactivé ?
    if ( this.config.auto_save) {
      TConsole.notice("Désactivation de l'auto-save")
    }
    // Niveau de débug au départ
    if ( undefined !== this.config.debug ) {
      if ( this.config.debug === false ) {
        Debug.level = 0
      } else if ( this.config.debug === true ) {
        Debug.level = 9
      } else /* en espérant que ce soit un nombre */ {
        Debug.level = this.config.debug
      }
    }
  }
  /**
    Pour supprimer le dossier des proximités
  **/
  removeProxFolderIfNecessaire(){
    if ( this.config.force_update === false ) return
    fs.existsSync(this.proxFolder) && execSync(`rm -rf "${this.proxFolder}"`)
    return !fs.existsSync(this.proxFolder)
  }

  get data(){
    if (undefined === this._data) {
      try {
        this._data = YAML.safeLoad(fs.readFileSync(this.path,'utf8'))
      } catch (err) {
        TConsole.showAllMessages()
        TConsole.error(`Problème en lisant le fichier YAML '${this.path}' (${err})`)
        this._data = {}
      }
    } return this._data
  }

  get config(){
    return this._config || ( this._config = this.data.config )
  }

  get path(){return this._path}
  set path(v){this._path = v}

  // Chemin relatif au fichier
  get textRelPath(){
    return this._textrelpath || (this._textrelpath = App.relativePath(this.textPath))
  }
  // Le path au fichier texte
  get textPath(){
    if (undefined === this._textpath) {
      this._textpath = path.join(this.folder, `${this.affixe}.txt`)
    } return this._textpath ;
  }
  get proxFolder(){
    return this._proxfolder || (this._proxfolder = path.join(this.folder, `${this.affixe}_prox`))
  }
  get folder(){
    return this._folder || (this._folder = path.dirname(this.path))
  }
  get affixe(){
    return this._affixe || (this._affixe = path.basename(this.path, path.extname(this.path)))
  }

}

module.exports = YAMLTest
