'use strict';
/** ---------------------------------------------------------------------
  *
  *   Class Busy
  *   ------------
  *   Gestionnnaire d'occupation
  *

  Version 0.0.1
  -------------

  Pour indiquer qu'une méthode/application est occupée, on appelle :
    Busy.start('<nom méthode ou autre>')
  Pour indiquer qu'une méthode/application est terminée, on appelle :
    Busy.stop('<nom méthode ou autre>')
  NB :  il est impératif que ce `<nom méthode ou autre>` soit strictement
        identique à celui qui a été utilisé pour la mettre en route avec
        `start`. Le plus simple et le plus sûr est d'utiliser 'objet-methode'
        mais quid d'une méthode appelée plusieurs fois ?

  Busy.ON   Retourne true si une méthode est encore en cours
  Busy.OFF    Retourne TRUE si aucune méthode/application n'est en cours

  Pour attendre jusqu'à ce que l'application ne soit plus occupée :

  async maFonction(){
    jeFaisQuelqueChose()
    await Busy.waitUntilNotBusy(60000/ * timeout optionnel * /)
    jeContinue()
  }
*** --------------------------------------------------------------------- */
class Busy {

  static start(method_id){
    this.methods || ( this.methods = new Map() )
    this.methods.set(method_id, true)
    this._on = true
  }
  static stop(method_id){
    try {
      this.methods || raise("aucune méthode n'est en route")
      this.methods.has(method_id) || raise("cette méthode n'a pas été démarrée")
      this.methods.delete(method_id)
      this._on = this.methods.size > 0
    } catch (motif) {
      console.error(`Je ne peux pas arrêter '${method_id}' : ${motif}…`)
    }
  }

  static waitUntilNotBusy(
      timeout   // +timeout+:: [Number] Temps maximum d'attente (30' / default)
    , freq      // +freq+:: [Number]    Fréquence du check (100" / default)
  ){
    timeout || (timeout = this.TIMEOUT_DEFAULT)
    freq || ( freq = this.FREQ_CHECK_DEFAULT)
    laps = 0
    var laps = 0
    return new Promise(async (ok,ko) => {
      while ( laps < timeout && this.ON ) {
        laps += freq
        this.wait(freq)
      }
      if ( this.OFF ) {
        ok()
      } else {
        if ( this.methods ) {
          ko(`= BUSY BY ${this.methodsOnList} =`)
        } else {
          // Ça ne doit pas pouvoir arriver
        }
      }
    })
  }

  /**
    Retourne la liste des méthodes qui sont toujours en route
  **/
  static get methodsOnList(){
    return (Array.from(this.methods.keys())).join(', ')
  }
  static wait(laps){
    return new Promise((ok,ko) => setTimeout(ok, laps))
  }

  static get ON(){
    return !!this._on
  }
  static get OFF(){
    return !this._on
  }

  static get TIMEOUT_DEFAULT(){ return 30000 /* 30 secondes */ }
  static get FREQ_CHECK_DEFAULT(){ return 100 }
}

Busy.waitUntilNotBusy = Busy.waitUntilNotBusy.bind(Busy)
