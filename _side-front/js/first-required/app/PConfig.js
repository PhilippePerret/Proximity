'use strict'
/** ---------------------------------------------------------------------
  Données de configuration propres à l'application courante
*** --------------------------------------------------------------------- */

const APP_DATA_CONFIG = {
  /**
    Noter : l'ID de configuration ci-dessous doit renvoyer à un
    titre de l'aide qui explique l'utilisation.
  **/
    pageLength:         {
        hname:  'Longueur d’une page (en signes)'
      , value:  PAGE_DEFAULT_LENGTH
      , type:   'number'
    }
  , distanceMinimale:   {
        hname:  'Distance de proximité par défaut'
      , value:  PMOT_DISTANCE_PROX_DEFAULT
      , type:   'number'
    }
  , indiceFrequence:    {
        hname:  'Prendre en compte la fréquence du mot'
      , value:  true
      , type:   'boolean'
    }
  , lastPageReadNumber: {
        hname: 'Dernier numéro de page'
      , value:1
      , type:   'number'
    }
  , compteDepot:        {
        hname: 'Compte de dépôt (Github)'
      , value:  null
      , type:   'long-string'
      , placeholder: 'http://...'
    } // par exemple Github
  , frequenceDepot:{
        hname: 'Fréquence du dépôt'
      , value: 'eachtime'
      , type:  'select'
      , values: [['eachtime','À chaque changement'],['dix','Tous les 10 changements']]
    }
}

if ('undefined' == typeof(window.DATA_MINI_AIDE)){window.DATA_MINI_AIDE = {}}
Object.assign(DATA_MINI_AIDE,{
  compteDepot: {
      title:'Compte de dépôt'
    , content:"Un compte de dépôt est un endroit tel que Github où peut être sauvegardé régulièrement le projet, afin d'en garder toujours une copie."
  }
, pageLength: {
      title:'Longueur de page'
    , content:"Détermine le nombre de signes pour faire une page. Influe sur l'affichage, mais pas sur les proximités."
  }
, distanceMinimale: {
      title: "Distance minimale"
    , content:"Détermine l'écartement en signe pour que deux mots commencent à rentrer en proximité. Cette valeur peut dépendre aussi de l'indice de fréquence."
  }
, indiceFrequence: {
      title: "Indice de fréquence"
    , content:"Si cette valeur est mise à true, la fréquence du mot influe sur la proximité. Plus le mot est rare, plus la proximité minimale diminuera, sauf s'il est très rare (< 3)."
  }
, lastPageReadNumber:{
      title: "Dernier numéro de page"
    , content: "Numéro de la page qui s'affichera au prochain lancement de l'application."
  }
})
