'use strict'
/** ---------------------------------------------------------------------
  *   Petit utilitaire pour benchmarquer des procédures
  *
*** --------------------------------------------------------------------- */

class Bench {
  static get(id){
    return this.items[id]
  }
  static start(id, options){
    options = options || {}
    if(undefined === this.items) this.items = {}
    Object.assign(this.items, {[id]: new Bench(id,options)})
    console.log("Bench.items =", Bench.items)
  }
  static stop(id){
    this.items[id].stop()
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(id, options){
    this.id = id
    this.start()
    this.verbose = !!(options && options.verbose)
  }

  start(){
    this.startTime = Number(new Date().getTime())
    if (this.verbose) console.log("Départ de '%s' : %dms", this.id, this.startTime)
  }
  stop(){
    this.endTime = Number(new Date().getTime())
    if (this.verbose) console.log("Fin de '%s' : %dms", this.id, this.endTime)
    if (this.verbose) this.report()
  }
  report(){
    console.log("Durée de la procédure '%s' : %dms (%ss)", this.id, this.laps, this.lapsSeconds)
    return {laps:this.laps, lapsSeconds:this.lapsSeconds, start:this.startTime, end:this.endTime}
  }
  get laps(){
    return this._laps || (this._laps = this.endTime - this.startTime)
  }
  get lapsSeconds(){
    return this._lapsseconds || (this._lapsseconds = this.calcLapsSeconds())
  }
  calcLapsSeconds(){
    var lapsS = String(Math.floor(this.laps / 1000))
    lapsS += `.${this.laps % 1000}`
    return lapsS
  }
}
