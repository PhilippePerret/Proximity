'use strict'
/**
  Méthodes utiles pour les dates
  Note : il vaut quand même mieux utiliser la classe SmartDay

  # version 0.1.1
    Rapatriement dans un fichier isolé
    
  Historique
  ----------
**/
/**
  Retourne la date et l'heure, très précise
  Note : il vaut mieux utiliser TODAY
**/
function now(){
  let d = new Date()
  return `${d.getDate()} ${d.getMonth()+1} ${d.getFullYear()} - ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`
}

function humanDateFor(date){
  if ( ! date ) return ''
  const hd = date instanceof Date ? date : new Date(date)
  var jour = hd.getDate()
  var mois = MOIS[hd.getMonth()].long
  var anne = hd.getFullYear()
  return `${jour} ${mois} ${anne}`
}
// Reçoit une date et retourne une valeur MM/JJ/YYYY en fonction délimiteur
// transmis ('/') par défaut
function mmddyyyy(date, delimiter){
  // console.log("-> mmddyyyy(%s)", date)
  delimiter = delimiter || '/'
  if ( date ) {
    date = new Date(date)
    return [date.getMonth()+1,date.getDate(),date.getFullYear()].join(delimiter)
  } else {
    return ''
  }
}
function ddmmyyyy(date, delimiter){
  delimiter = delimiter || '/'
  if (false === (date instanceof Date)) date = new Date(date)
  return [date.getDate(),date.getMonth()+1,date.getFullYear()].join(delimiter)
}
// Reçoit une date et retourne une valeur YYYY-MM-DD en fonction délimiteur
// transmis ('-' par défaut)
// Si date n'est pas fournie, on prend la date du moment
// typiquement pour les noms de fichiers
function yyyymmdd(date, delimiter){
  delimiter = delimiter || '-'
  date = date ? new Date(date) : new Date()
  return [date.getFullYear(),date.getMonth()+1,date.getDate()].join(delimiter)
}
