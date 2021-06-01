'use strict';
/** ---------------------------------------------------------------------
  *   Class BigCalculator
  *   -------------------
  *   Pour le recalcul complet du projet

Ce Big Calculator est utilisé lorsqu'on change une valeur qui intervient
dans le calcul des proximités. Pour le moment, il s'agit de la distance
minimale par défaut et/ou de la prise en compte de la fréquence des mots

Noter que les "ignore" étant attachés aux canons et aux mots eux-mêmes,
effacer toutes les proximités ne pose aucun problème.
*** --------------------------------------------------------------------- */

class BigCalculator {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */


  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(ptexte){
    this.ptexte = ptexte
    this.config = ptexte.config
  }

  /**
    Mise en exécution du calcul
  **/
  exec(){
    flash('Recalcul des proximités, merci de patienter…')
    this.resetAll()
    PCanon.analyseAllProximities()
    this.ptexte.saveAll()
    flash()
  }

  /**
    Réinitialisation complète
      - suppression de toutes les proximités
      - suppression de tous les marquages de proximités
  **/
  resetAll(){
    Proximity.removeAll(/* saving= */ false)
    Proximity.reset()
  }

}

module.exports = BigCalculator
