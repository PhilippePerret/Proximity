'use strict'
/**
  Quelques méthodes pratiques

  # version 0.1.8

  Historique
  ----------
  # 0.1.8
      Modification de raise pour pouvoir passer des objets
  # version 0.1.7
      Possibilité d'envoyer null en premier argument de temporizeAvant et
      temporize
  # version 0.1.6
    + methode isNullish
  # version 0.1.5
    + méthode checksum
    + méthode temporize
    + méthode temporizeAvant
  # version 0.1.4
    + Méthode 'raise_backtrace'
  # version 0.1.3
    + Méthode 'unless'
  # version 0.1.2
    Méthode raise
**/
// Pour pouvoir utiliser par exemple 'correct || raise("Ça n’est pas correct")'
// Note : on peut aussi envoyer un object (une table)
function raise(msgErr) {
  if ( typeof msgErr === 'string' ) {
    throw new Error(msgErr)
  } else {
    throw msgErr
  }
}

function raise_backtrace(msg) {
  try {
    throw new Error("Pour voir le backtrace")
  } catch (err) {
    let laconsole
    if ('undefined' === typeof TConsole){
      laconsole = console
    } else {
      laconsole = TConsole
    }
    laconsole.error(`${msg} [Pour voir le backtrace]`)
    laconsole.log(err.stack)
  }
}

function stopEvent(ev){
  ev.preventDefault()
  ev.stopPropagation()
  return false
}

function unless(condition, fnc){
  if ( condition ) return ;
  return fnc.call()
}

// Pour tester si une valeur est nulle ou indéfinie, mais pas égale à 0
function isNullish(foo) {
  return foo === undefined || foo === null
}

function temporize(method, laps = 5000){
  return new Promise((ok,ko)=>{
    method instanceof(Function) || ok()
    try {
      method.call()
    } catch (e) {
      ko(e)
    }
    setTimeout(ok,laps)
  })
}

function temporizeAvant(method, laps = 5000){
  return new Promise((ok,ko)=>{
    if ( method instanceof Function ) {
      setTimeout( () => {
        if ( method instanceof Function ) {
          method.call()
        }
        ok()
      }, laps)
    } else {
      ok()
    }
  })
}

const crypto = require('crypto')
function checksum(str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'sha1' /* 'md5' */)
    .update(str, 'utf8')
    .digest(encoding || 'hex')
}
