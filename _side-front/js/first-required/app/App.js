'use strict'
/** ---------------------------------------------------------------------
  *   Object App
  *   ----------
  *   L'application
  --------------
  version 0.5.0
  --------------

  # 0.5.0
      Ajout de la méthode App.absolutePath qui retourne un path absolu
      fonctionnant aussi bien en développement qu'en production (package)
*** --------------------------------------------------------------------- */
const App = {

  async init(){
    // Si on utilise Debug.js, on peut décommenter la ligne suivante
    // pour ne pas débugger ou débugger
    X().stop() // ne pas débugguer
    // Debug.level = 2
    // X().start() // débugguer

    X(2, '-> App.init()')


    //*/ Le code propre à l'application
    this.loading = true
    UI.init()
    UI.appInit()
    Prefs.load()
    if ( Prefs.get('load_last_on_start') && Prefs.get('path_texte') ) {
      PTexte.open(Prefs.get('path_texte'))
    } else {
      this.onReady()
    }
    this.loading = false
    //*/ // Fin du code propre

    X(2, '<- App.init()')
  }

  /**
    Méthode appelée après le chargement du texte courant (if any)
    ou l'initialisation de l'application (ci-dessus)
  **/
, onReady(){
    // TEST
    // new PReport().show()
    // console.log("-> App.onReady")

    // Pour indiquer que le chargement du texte est fini (s'il y en a un)
    // Sert surtout aux tests.
    // SURTOUT PAS ! On atteint cette méthode avant que toutes les pages
    // ne soit chargée. TROUVER un autre moyen pour les tests.
    // NON!!! PTexte.loading = false


    /*//
      // Pour lancer un check du texte dès le départ
      const checker = new (App.requireModule('checker'))(PTexte.current)
      checker.checkAndDisplay()
    //*/

    process.env.TESTS && this.runTests()

  }

, runTests(){
    // global.PTests = this.requireModule('PTests/PTests')
    // PTests.run()P
    if ( undefined === this.TestProx ){
      console.log("Je requiers TestProx")
      this.TestProx = require('../tests_prox/TestProx.c.js')
    } else if (this.TestProx.running) {
      // Les tests sont en train d'être joués, ne rien faire
      return false
    } else {
      // Ça veut dire que les tests sont lancés
      console.log("-> Tests relancés")
    }
    console.log('--> this.TestProx.run()')
    this.TestProx.run()
  }

  /**
    Chargement du module d'affixe +moduleName+
  **/
, requireModule(moduleName){
    return require(path.join(this.modulesFolder,`${moduleName}.js`))
  }

  /**
    Retourne le path absolu, en développement ou en production, du
    path relatif +relativePath+

    +Params+::
      +relativePath+::[String] Chemin relatif
  **/
, absolutePath(relativePath){
    return path.normalize(path.join(app.getAppPath(),relativePath))
  }

  /**
    Retourne le path relatif
  **/
, relativePath(pth){
    pth = path.normalize(pth)
    return pth.replace(this.regFullPath, './')
  }

  /**
    En cas d'erreur, on appelle toujours cette méthode.
    Par exemple :
      mafonctionasync()
        .then(autrefonction)
        .catch(App.onError)
  **/
, onError(err) {
    if (false == UI.errorAlreadySignaled){
      UI.flash("Une erreur est survenue (consulter la console)", {style:'warning', keep:true})
      UI.errorAlreadySignaled = true
    }
    console.error(err)

    /**
      Quand on teste l'application, l'objet C gère la console, empêchant que les
      messages normaux s'affichent (console.log, etc.). Donc le message d'erreur
      ci-dessus ne sera pas affiché. On doit donc "purger" le contenu de C pour
      voir tous les messages.
    */
    if ('undefined' != typeof(C)){
      showAllMessages()
    }
    var msg ;
    if ( err ) {
      if ( 'string' === typeof err ) { msg = err }
      else { msg = err.message }
      // On affiche le message
      error(msg)
    }
  }

, unBouton(){
    alert("Vous pouvez utiliser ce bouton pour lancer une opération.")
  }
}

Object.defineProperties(App,{
  ApplicationSupportFolder:{get(){
    if (undefined === this._appsupportfolder){
      this._appsupportfolder = app.getPath('userData')
    } return this._appsupportfolder
  }}

, modulesFolder:{get(){
    return this._modulesfolder || (this._modulesfolder = path.join(app.getAppPath(),'_side-front','js','modules'))
  }}

, regFullPath:{get(){
    if (undefined === this._regfullpath){
      this._regfullpath = new RegExp(`^${app.getAppPath()}\/`)
    } return this._regfullpath;
  }}
})

App.onReady = App.onReady.bind(App)
