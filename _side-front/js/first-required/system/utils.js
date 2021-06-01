'use strict';
/**
  Méthodes utiles
  ---------------

  ### Version 0.1.4

  # 0.1.4
      + méthode isNotArray
  # 0.1.3
    Séparation du module utils.js -> Dom_utils.js (retrait de
    toutes les méthodes utilitaires pour le DOM)
  # 0.1.2
    + méthode DSetValue

  # 0.1.1
    + méthode DGetValue


  Pour requérir un module en ayant un backtrace en cas d'erreur.

  Le mieux est de toujours envoyé `__dirname` en second argument et de définir
  le +rpath+ en fonction de l'endroit courant.
      let maConstante = tryRequire('./insamefolder', __dirname)

**/
global.tryRequire = function(rpath, folder){
  try {
    isDefined(folder) && ( rpath = [folder,rpath].join(path.sep) )
    return require(rpath)
  } catch (e) {
    if ( NONE !== typeof(log) ) {
      log.error("[LOG] ERROR REQUIRE AVEC LE PATH", rpath)
      log.error(e)
    } else {
      console.error("[CONSOLE] ERROR REQUIRE AVEC LE PATH", rpath)
      console.error(e)
    }
  }
}

// function log(msg, options = []){
//   console.log(msg, ...options)
// }

// function confirm(msg, options){
//   options = options || {}
//   let mbox = new MessageBox(isString(msg) ? Object.assign(options, {message: msg}) : msg)
//   mbox.show()
// }
// Cf. Dialog.js

/**
  Contrairement à confirm, cette méthode s'utilise avec await :
  if ( await confirmer(...) ){'
    * Si on a choisi oui *
  }' else {'
    * si on a choisi non *
  }
**/
function confirmer(msg, options){
  options = options || {}
  let mbox = new MessageBox(isString(msg) ? Object.assign(options, {message: msg}) : msg)
  return new Promise((ok,ko)=>{
    mbox.methodOnOK =     () => {ok(true)}
    mbox.methodOnCancel = () => {ok(false)}
    mbox.show()
  })
}

/**
  Un simple message avec un bouton OK
  @sync, s'utilise avec await.
**/
function message(msg, options){
  options = options || {}
  Object.assign(options, {
      message:msg
    , buttons:['OK']
    , type: options.type || 'notice'
    , defaultButtonIndex: 0
  })
  let mbox = new MessageBox(options)
  return new Promise((ok,ko)=>{
    mbox.methodOnOK = () => {ok(true)}
    mbox.show()
  })
}

function error(msg, options){
  options = options || {}
  Object.assign(options, {type:'error'})
  return message(msg, options)
}

// // Demande une réponse
// // On utilise `confirm` parce que la seule différence, c'est que `args`
// // définit `defaultAnswer` qui permet de savoir que c'est un prompt
// function prompt(msg, args){ return confirm(msg, args) }
// Cf. Dialog.js

/**
  Retourne null dans tous les cas où +foo+ est vide
  Donc une chaine vide, une liste vide, un objet vide, etc.
**/
window.nullIfEmpty = function(foo){
  if ( 'string' === typeof(foo) && foo == '') return null
  if ( undefined === typeof(foo) ) return null
  if ( (foo.length instanceof Function) && foo.length == 0) return null
  if ( 'object' === typeof(foo) && Object.keys(foo).length == 0) return null
  return foo
}

window.isUndefined = function(foo){ return 'undefined' === typeof(foo) }
// function isDefined(foo){ return false === isUndefined(foo) }
window.isDefined = function(foo){ return false === isUndefined(foo) }

window.isBoolean = function(foo){return STRboolean === typeof foo }
window.isNumber = function(foo){return STRnumber === typeof(foo)}
window.isNotNumber = function(foo){return false === isNumber(foo)}

window.isNull = function(foo){ return null === foo }
window.isNotNull = function(foo){ return isFalse(isNull(foo)) }
window.isNullish = function(foo){ return isNull(foo) || isUndefined(foo) }
window.isNotNullish = function(foo){ return false === isNullish(foo) }

window.isFalse = function(foo){ return false === foo }
window.isNotFalse = function(foo) { return isFalse(isFalse(foo))}
window.not = function(foo){ return false == foo }

window.isTrue = function(foo){ return true === foo }
window.isNotTrue = function(foo){return isFalse(isTrue(foo))}

window.isEmpty = function(foo){
  if(!foo) return true
  if(isDefined(foo.length) /* string ou array */){
    return 0 == foo.length
  } else if (isObject(foo)){
    return 0 == Object.keys(foo).length
  }
}
window.isNotEmpty = function(foo){
  if(!foo) return false
  return false === isEmpty(foo)}
window.isNotAscii = function(str){ return str.replace(/[a-zA-Z0-9_]/g,'') != '' }
window.isFunction = function(foo){ return foo instanceof Function }
window.isNotFunction = function(foo){ return false === isFunction(foo) }
window.isString = function(foo)  { return 'string' === typeof(foo) }
window.isNotString = function(foo){return false === isString(foo)}
window.isObject = function(foo)  { return STRobject == typeof(foo) && !isArray(foo) }
window.isArray = function(foo)   { return Array.isArray(foo) }
window.isNotArray = function(foo){return false === isArray(foo) }

// Fonction utiles pour le dom

window.isTextarea = function(foo){
  if(isDefined(foo.length)) foo = foo[0] // jquerySet
  if(isDefined(foo.tagName)) return foo.tagName === 'TEXTAREA'
  return false
}

/**
  Retourne false si l'élément +domE+ ne possède pas l'attribut +attr+ ou,
  si +valOpt+ est fourni, si la valeur n'est pas égale à cette valeur.

  @param {jqSet}  jqObj   Obligatoirement un set jQuery
  @param {String} attr    L'attribut recherché.
  @param {String} valOpt  La valeur optionnellement recherchée

  @return {Boolean|String} true/false ou la valeur de attr si +valOpt+ n'est pas
                            fourni.
**/
function isDOMElementWithAttribute(jqObj, attr, valOpt){
  if(isUndefined(jqObj)) return false
  if(isNotFunction(jqObj.attr)) return false
  if(isUndefined(jqObj.attr(attr))) return false
  if (isDefined(valOpt)){
    return jqObj.attr(attr) == valOpt
  } else {
    return jqObj.attr(attr)
  }
}

function asPourcentage(expected, actual){
  return `${pourcentage(expected,actual)} %`
}
function pourcentage(expected, actual){
  return Math.round(100 * (100 * actual / expected)) / 100
}

/**
 * Retourne la fonction voulue
 *
 * Note : pour le moment, ça ne fonctionne que pour des instances. Il faudrait
 * faire un test pour voir si bindee.constructor existe.
 *
 * @usage
    methode(arg1, arg2)CROCHET_OUVERT
      (this._methode || requireChunk(this, 'methode')).bind(this)(arg1, arg2)
    CROCHET_FERME

    La méthode doit être définie dans ./js/chunks/<this.constructor>/<methode>.js de
    la façon suivante :
    module.exports = function(arg1, arg2){
      //... code de la fonction
    }
    Pour la clarté
 */
function requiredChunk(bindee, methodName){
  bindee.constructor.prototype[`_${methodName}`] = require(`./js/chunks/${bindee.constructor.name}/${methodName}.js`)
  return bindee[`_${methodName}`].bind(bindee) // sera déjà bindée
}

/**
  * Pour pouvoir utiliser la tournure
    this._propriete || defP(this, '_propriete', valeur)
    return this._propriete
  */
window.defP = function(obj, prop, val){
  obj[prop] = val
  return val
}
// function defP(obj, prop, val){
//   obj[prop] = val
//   return val
// }

/**
  Remplace la tournure :
    if (undefined === objet.property) objet.property = default_value
  Et retourne la valeur de la propriété
  Note : quand c'est possible, préférer :
    `variable = variable || valeurDefaut`
**/
function defaultize(objet, property, default_value){
 isDefined(objet[property]) || ( objet[property] = default_value)
 return objet[property]
}

// Pour mettre dans le presse-papier
function clip(str){
  const { clipboard } = electron.remote
  clipboard.writeText(str) ;
  F.notify(`${str} -> presse-papier`)
};
