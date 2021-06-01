'use strict';
const DATA_OPERATIONS_CHECKER = require('./data_errors.js')

class CheckerError {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */
  static reset(){
    this.items  = new Map()
    this.lastId = 0 // 1-start
    this.totalFixedCount = 0 // nombre d'erreurs réparée
  }

  static add(checkerError){
    checkerError.id = this.newId()
    this.items.set(checkerError.id, checkerError)
  }

  static newId(){
    return ++this.lastId
  }

  static get count(){return this.items.size /* Map! */}

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(checker, data){
    this.checker = checker
    this.numError = data.n || raise("Il faut indiquer le numéro de l'erreur par {n:<numéro>}")
    this.params   = data.p
    this.sujet    = data.sujet
    // On l'ajoute à la liste générale des erreurs
    this.constructor.add(this)
    if (this.data.fatal === true) {
      throw new Error(this.messageFatalError)
    }
    /**
      Si l'erreur n'est pas réparable et que le sujet est fourni,
      on demande à la classe du sujet de détruire ce sujet
    **/
    if ( false === this.isReparable ){
      this.sujet.constructor.remove(this.sujet)
      this.checker.addMessage(`${this.sujet.ref} irréparable => destruction`)
      this.fixed = true
      ++ this.constructor.totalFixedCount
    }
  }

  get isReparable(){ return this.data.reparable && this.sujet}

  get fixed(){return this._fixed}
  set fixed(v){this._fixed = v}

  get messageFatalError(){
    return `FATAL ERROR: ${this.failureMessage}\n\nJe ne peux pas corriger cette erreur.`
  }
  get failureMessage(){
    if (undefined === this._failmessage) {
      var str = ''
      if ( this.sujet ) { str += `${this.sujet.constructor.name}#${this.sujet.id} ` }
      str += temp(this.data.err, this.params)
      this._failmessage = str
      str = null
    } return this._failmessage ;
  }
  get data(){return DATA_OPERATIONS_CHECKER[this.numError]}
}

module.exports = CheckerError
