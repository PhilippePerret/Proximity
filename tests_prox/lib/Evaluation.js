

class Evaluation {
  static addSuccess() { ++ this._successcount; ++ this.totalSuccessCount }
  static addFailure() { ++ this._failurecount; ++ this.totalFailureCount }
  static addPending() { ++ this._pendingcount; ++ this.totalPendingCount }
  static get successCount(){ return this._successcount }
  static get failureCount(){ return this._failurecount }

  static reset(){
    this.totalSuccessCount = 0
    this.totalFailureCount = 0
    this.totalPendingCount = 0
  }
  /**
    Attention, cette méthode est appelée par chaque test, pour connaitre
    le nombre de réussites et d'échecs.
  **/
  static resetCount(){
    this._successcount = 0
    this._failurecount = 0
    this._pendingcount = 0
  }

  constructor(titre, expected, actual, params){
    this.titre = titre
    this.expected = expected
    this.actual   = actual
    this.params   = params || {}
    this.verbose  = (this.params.silence !== true) // verbosité
    this.evaluate()
  }

  // Méthode qui évalue l'instance
  evaluate(){
    const OK = Boolean(this.resultat)
    this.constructor[`add${OK?'Success':'Failure'}`].call(this.constructor)
    if ( this.verbose || !OK ) {
      const couleur = OK ? 'green' : 'red'
      let msg = `${this.titre} ${OK ? 'OK' : 'NOT OK'}`
      if ( !OK ) { msg += ` (expected: ${this.expected}, actual: ${this.actual})`}
      const method = OK ? 'success' : 'failure'
      TConsole[method].call(TConsole,msg)
    }
  }

  get resultat(){
    if ( undefined === this._resultat ) {
      this._resultat = this.defineResultat()
    } return this._resultat
  }
  defineResultat(){
    if ( this.strict && (this.expected === this.actual)) {
      return true
    } else if ( this.expected == this.actual ) {
      return true
    } else {
      return false
    }
  }

  get strict(){
    return this._strict || (this._strict == !!(this.params && this.params.strict))
  }
}

module.exports = Evaluation
