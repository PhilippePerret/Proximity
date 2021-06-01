'use strict'
/** ---------------------------------------------------------------------

  Ce fichier définit toutes les proximités spéciales pour tout texte
  dans l'absolu.
  - C'est lui qui définit par exemple que le mot 'avec' ne possède pas la
    distance minimale (DM) de 1500 signes comme tous les autres mots, mais une
    DM de 250. (cf. SPEC_DISTANCES_CANONS)
  - C'est lui qui définit que 'vous', 'nous', 'elle', etc. ne doivent pas être
    étudiés au niveau de la proximité. (cf. PMOT_EXCLUDED_CANON)
  - C'est lui qui définit que 'plus' ne doit pas être considéré comme un
    élément du canon 'plaire', mais doit rester lui-même. (cf. PMOT_REALMOT2REALCANON)

  Ces constantes appartiennent à la classe PMot.


*** --------------------------------------------------------------------- */

// Longueur par défaut d'une page
// On peut changer cette valeur dans les configurations du texte
const PAGE_DEFAULT_LENGTH = 1500

const PMOT_DISTANCE_PROX_DEFAULT = 1500

const LOCUTIONS_TIRETS = [
    'grand-chose'
  , 'grand-mère', 'grand-père', 'grand-oncle'
  , 'parti-pris'
  , 'partis-pris'
  , 'peut-être'
  , 'rendez-vous'
]

const LOCUTIONS_ATOMIQUES = [
    'sans doute'
  , ['aujourd\'hui', 'aujourd’hui']
]

const LOCUTIONS_REPETITIVES = {
    'de plus en plus': {mot:'plus'}
  , 'peu à peu': {mot:'peu'}
  , 'petit à petit': {mot: 'petit'}
  , 'coûte que coûte': {mot: 'coûte'}
}

// Canons dont il ne faut pas tenir compte dans l'analyse des proximités
const EXCLUDED_CANON_LIST = [
    'avoir'
  , 'de', 'des'
  , 'être', 'elle'
  , 'ils', 'il'
  , 'la', 'le', 'les', 'lui'
  , 'nous'
  , 'par', 'pas'
  , 'son', 'ses'
  , 'tu'
  , 'un', 'une'
  , 'vous'
]

const PMOT_REALMOT2REALCANON = {
    'plus':   'plus' // sinon, c'est 'plaire'
  , 'puis':   'puis' // sinon c'est 'pouvoir'
  , 'devant': 'devant' // sinon, c'est 'devoir'
}

/**
  Constante qui contient la définition des distances particulières en
  fonction des canons.
**/
const PMOT_SPEC_DISTANCES_CANONS = {
    'alors':      {distanceMinimale: 500}
  , 'avec':       {distanceMinimale: 250}
  , 'cette':      {distanceMinimale: 200}
  , 'comme':      {distanceMinimale: 300}
  , 'dans':       {distanceMinimale: 250}
  , 'jamais':     {distanceMinimale: 250}
  , 'mais':       {distanceMinimale: 500}
  , 'plus':       {distanceMinimale: 200}
  , 'pour':       {distanceMinimale: 250}
  , 'que':        {distanceMinimale: 500}
  , 'qui':        {distanceMinimale: 500}
  , 'sur':        {distanceMinimale: 100}
  , 'tous':       {distanceMinimale: 200}
}

/**
  Les canons non traitables comme proximité

  Note : il s'agit forcément de mots de plus de 3 lettres car les autres
  sont déjà exclus de par leur taille < 4.
**/
const PMOT_EXCLUDED_CANON = (function(){
  var h = {}
  EXCLUDED_CANON_LIST.forEach(canon => Object.assign(h, {[canon]: true}))
  return h
})()
