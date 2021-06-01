'use strict'
/** ---------------------------------------------------------------------
  *   Classe TTexte
  *
  *
*** --------------------------------------------------------------------- */

class TTexte {
  constructor(){
    this.ptexte = PTexte.current
  }

  // ---------------------------------------------------------------------
  /*
    Mots methods
  */
  // Retourne le nombre de mots actuels dans le texte
  get mots(){
    return {
      nombre: PMot.count
    }
  }

  /*
      Canons methods
  */
  get canons(){
    return {
      nombre: PCanon.count
    }
  }

  get proximites(){
    return {
      nombre: Proximity.count
    }
  }
  /*
    Proximities method
  */
  get nombre_proximites(){
    return Proximity.count
  }
}

module.exports = TTexte
