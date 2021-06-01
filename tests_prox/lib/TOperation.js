'use strict'
/** ---------------------------------------------------------------------
  *
  *   Classe TestOperation
  *

  Permet de gérer les opérations définies dans les fichiers de tests
  YAML, dans la partie operations:
*** --------------------------------------------------------------------- */
const Action      = require('./Actions.js')

const WAITING_BUSY_LAPS = 500
const TIMEOUT_BUSY_LAPS = 60000

class TOperation {
  /**
    Instanciation
  **/
  constructor(test, dope) {
    this.test = test
    this.data = dope
    this.data.actions || raise(`Il faut absolument définir les 'actions' de l'opération '${this.titre}'`)

    this.executeActions   = this.executeActions.bind(this)
    this.checkStateBefore = this.checkStateBefore.bind(this)
    this.checkStateAfter  = this.checkStateAfter.bind(this)
    this.executeAction    = this.executeAction.bind(this)
    this.unsetDebugLevel  = this.unsetDebugLevel.bind(this)

  }

  log(msg){
    VERBOSE && TConsole.raw(`[${this.ref}] ${msg}`)
  }

  get ref(){
    return this._ref || (this._ref = `Opération "${this.titre}"`)
  }
  /**
    = main =

    Méthode principale qui
      1. check l'état de départ si nécessaire
      2. accomplit toutes les actions (de façon asynchrone si nécessaire)
      3. check l'état final (toujours normalement)
  **/
  run(){
    this.log('-> run')
    return new Promise((OK,ko) => {
      TConsole.operation(this.titre)
      this.setDebugLevel() // if any
      this.checkStateBefore()
      .then(this.executeActions)
      .then(this.checkStateAfter)
      .then(this.unsetDebugLevel)
      .then(OK)
      .catch(ko)
    })
  } // /run

  checkStateBefore(){
    this.log('-> checkStateBefore')
    return new Promise((OK,ko) => {
      if ( this.data.before ) {
        // Si le check est invalide, on passe l'opération
        if ( false === this.test.checkState(this.data.before, {silence: true, before:true}) ) {
          TConsole.error("État initial invalide. Je ne joue pas l'opération.")
          ko('- État initial invalide. Je ne joue pas l’opération. -')
        }
      }
      OK()
    })
  }

  setDebugLevel(){
    var debug = this.debug
    if ( debug !== null ) {
      debug === true && ( debug = 9 ) // sinon c'est la valeur
      X().setMaxLevel(debug)
    }
  }

  // Toujours, à la fin d'une opération, on remet le niveau de
  // débug à la valeur qu'il avait avant.
  unsetDebugLevel(){
    return new Promise((ok,ko)=>{
      X().unsetMaxLevel()
      ok()
    })
  }

  executeActions(){
    this.log('-> executeActions')
    return new Promise(async (OK,ko) => {
      this.log(`*** Exécution des (${this.data.actions.length}) actions`)
      var daction
      var actionList = this.data.actions.slice()
      while(daction = actionList.shift()){
        this.log(`---> executeAction(${daction[0]})`)
        await this.executeAction(daction)
        this.log(`<--- executeAction(${daction[0]})`)
      }
      this.log(`=== Fin Exécution des (${this.data.actions.length}) actions`)
      OK()
    })
  }
  checkStateAfter(){
    this.log('-> checkStateAfter')
    return new Promise((OK,ko)=> {
      if ( this.data.after ) {
        if ( this.test.checkState(this.data.after, {silence:true, after:true}) ) {
          TConsole.success("L'état final est correct")
        } else {
          TConsole.failure("L'état final est incorrect.")
        }
      }
      OK()
    })
  }

  /*
    Sous-méthodes
  */

  /**
    Méthode qui exécute l'action définie par les données +daction+

  **/
  async executeAction(daction){
    this.log('-> executeAction')
    // En fonction du nombre d'argument
    let args = daction[1] ;
    undefined !== args || ( args = [] )
    const argsCount = isArray(args) ? args.length : 1
    this.log(`-> action '${daction[0]}' called`)
    switch(argsCount){
      case 0 :
        await Action[daction[0]].call(Action)
        break
      case 1 :
        await Action[daction[0]].call(Action, args)
        break
      default:
        await Action[daction[0]].call(Action, ...args)
    }
    this.log(`<- action '${daction[0]}' finished`)
    // Après l'action, on attend que PTexte ne soit plus occupé
    return new Promise((ok,ko) => {
      this.busyWaitingFor = 0 // pour le timeout
      this.waitForNotPTexteBusy(ok,ko)
    })
  } // executeAction


  waitForNotPTexteBusy(OK,ko){
    if ( undefined !== this.busyTimer ) {
      clearTimeout(this.busyTimer)
      this.busyTimer = null
    }
    this.busyWaitingFor += WAITING_BUSY_LAPS
    if ( this.busyWaitingFor > TIMEOUT_BUSY_LAPS ) {
      ko(`--- timeout operation "${this.titre}" ---`)
    } else {
      if ( Busy.ON ) {
        this.busyTimer = setTimeout(this.waitForNotPTexteBusy.bind(this,OK,ko), WAITING_BUSY_LAPS)
      } else {
        OK()
      }
    }
  }

  checkIfBusy(){
    return !!PTexte.busy
  }
  /*
      Properties
  */
  get titre(){
    if (undefined === this._titre) {
      this._titre = this.data.titre||this.data.id||"Une opération est jouée (il vaut mieux définir sont 'titre' et/ou son 'id')"
    } return this._titre ;
  }

  get debug(){ return this.data.debug || null}

}

module.exports = TOperation
