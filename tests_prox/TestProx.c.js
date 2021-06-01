'use strict';

global.VERBOSE = false
/** ---------------------------------------------------------------------
  *   TestProx
  *   ----------
  *   Pour jouer les tests

Le module doit être appelé par l'application.
Lire le mode d'emploi pour connaitre le fonctionnement.
*** --------------------------------------------------------------------- */
const fs    = require('fs')
const path  = require('path')
const YAMLBack = require('js-yaml')
const YAMLTest = require('./lib/YamlTest.js')
global.TConsole = require('./lib/TConsole')

global.showAllMessages = TConsole.showAllMessages.bind(TConsole)

class TestProx {
  static log(msg) {
    VERBOSE && TConsole.raw(`[TestProx] ${msg}`)
  }

  static run(){
    // return // en cas de problème

    // Un bloqueur qui empêche de relancer les tests trop rapidement
    const thisTime = (new Date()).getTime()
    // console.log("thisTime = ", thisTime)
    const inter = this.lastTime ? Number(thisTime - this.lastTime) : null ;
    const tooClose = !!(inter && (inter < 20000))
//     console.log(`
// lastTime: ${this.lastTime}
// thisTime: ${thisTime}
// diff    : ${inter}
// tooClose: ${tooClose}
//       `)
    if ( tooClose ) {
      console.warn("Temps trop court entre le dernier appel et celui-là => je m'en retourne sans jouer les tests.")
      return
    } else {
      this.lastTime = Number(thisTime)
    }


    this.log('-> run (this.running: %s)', this.running)
    if ( this.running ) return
    else this.running = true ;
    this.runNextTest  = this.runNextTest.bind(this)
    this.marqueFinRunTest = this.marqueFinRunTest.bind(this)
    this.onError      = this.onError.bind(this)
    // On y va
    this.getAllTests()
    this.startTests()
  }

  static startTests(){
    console.clear()
    this.running = true
    this.reset()
    this.runNextTest()
  }

  static runNextTest(){
    this.log('-> runNextTest')
    const test = new YAMLTest(this.testPaths.shift())
    if ( test.path ) {
      test.run()
      .then(this.runNextTest)
      .then(this.marqueFinRunTest)
      .catch(this.onError)
    } else {
      // === FIN DES TESTS ===
      this.stopTests()
    }
  }

  static marqueFinRunTest(){
    return new Promise((OK,ko)=>{
      this.log('<- runNextTest')
      OK()
    })
  }

  static stopTests(){
    TConsole.onEnd()
    console.log("%c=== FIN DES TESTS ===", 'font-weight:bold;color:green;font-size:1.4em;')
    this.printBilanFinal()
    this.running = false
  }

  static onError(err){
    console.error(err)
  }

  static reset(){
    Eval.reset()
    this.testsStartTime = Number(new Date())
  }

  static printBilanFinal(){
    const successCount = Eval.totalSuccessCount
    const failureCount = Eval.totalFailureCount
    const pendingCount = Eval.totalPendingCount
    this.testsEndTime = Number(new Date())
    const duree = (this.testsEndTime - this.testsStartTime) / 1000 ;
    const couleur = failureCount ? 'red' : (pendingCount ? 'orange' : 'green') ;
    const message = `Success ${successCount} - Failures ${failureCount} - Pendings ${pendingCount}`
    // note : `console` a retrouvé l'usage de sa parole
    console.log('')
    console.log(`%c(duration: ${duree})`, 'font-size:11pt;color:grey;')
    console.log(`%c${message}`, `color:${couleur};font-size:16pt;font-weight:bold;display:inline-block;border:1px solid;padding:0.5em 1em;`)
    console.log('')
  }

  /**
    Relève tous les tests à jouer.
    Cf. dans le manuel la règle des + et des -
  **/
  static getAllTests(){
    console.log("this.testsFolder = ", this.testsFolder)
    // On commence par regarder si un dossier contient un '+' ou un '-'
    this.hasDossierWithPlus   = glob.sync(`${this.testsFolder}/**/\+*`).length > 0
    this.hasDossierWithMoins  = glob.sync(`${this.testsFolder}/**/\-*`).length > 0
    this.testPaths = []
    this.fouilleDossierTests(this.testsFolder)
    TConsole.log(this.testPaths)
  }
  static studyTestFile(testfile){
    if ( fs.statSync(testfile).isDirectory() ) {
      // Si c'est un dossier, il faut voir s'il faut le prendre
      const firstChar = path.basename(testfile).substring(0,1)
      if ( firstChar == '-' ){
        return ; // toujours
      }
      if ( this.hasDossierWithPlus && firstChar != '+') return ;
      // Sinon on peut le fouiller
      this.fouilleDossierTests(testfile)
    } else /* un fichier qui a passé le test */ {
      if ( path.extname(testfile) == '.yaml') {
        // On ne prend que les fichiers YAML
        this.testPaths.push(testfile)
      }
    }
  }
  static fouilleDossierTests(dossier){
    var testsfiles = glob.sync(`${dossier}/*`)
    testsfiles.forEach(testfile => this.studyTestFile(testfile))
  }

  static get testsFolder(){
    return this._testsfolder || (this._testsfolder = path.join(this.folder,'tests'))
  }
  static get folder(){
    return this._folder || (this._folder = App.absolutePath(path.join('.','tests_prox')))
  }

}
module.exports = TestProx
