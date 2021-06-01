'use strict'
/** ---------------------------------------------------------------------
  *   Class Log
  *   Pour le log des messages console
  *

USAGE
-----
  Utiliser `DEBUG(ON)` pour mettre le début en route et `DEBUG(OFF)` pour
  l'arrêter
*** --------------------------------------------------------------------- */

class Log {
  static write(ownerName, styleMessage, message){
    if (this.debugIsON){
      console.log(`%c[${ownerName}][${now()}] ${message}`, styleMessage)
    }
  }

  static get debugIsON(){return this._debugIsON}
  static set debugIsON(v){this._debugIsON = v}
  static toggleDebug(v){
    if (undefined === v) v = !this.debugIsON
    this.debugIsON = v
  }
}

const ON  = true
const OFF = false
const DEBUG = Log.toggleDebug.bind(Log)
