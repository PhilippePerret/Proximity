'use strict';
/** ---------------------------------------------------------------------
  *   TConsole (utilisé en tant que 'C')
  *   ----------------------------------
  *   Gestion de toutes les sorties en console
*** --------------------------------------------------------------------- */

const oldConsoleLog   = console.log.bind(console)
const oldConsoleWarn  = console.warn.bind(console)
const oldConsoleError = console.error.bind(console)
// Voir les redéfinition en bas de module

class TConsole {
  constructor(){
    this.logstack = [] // liste des message
    this.nb_logstack = 0 // nombre de messages
  }
  get FONT_SIZE(){return '12.2pt'}
  get FONT_SIZE_TITRE(){return '13.1pt'}

  /*
    Public methods
  */
  titre(str){return this.titrelize(str,1)}
  soustitre(str){return this.titrelize(str,2)}

  failure(str, options){
    return this.red(`🆘 ${str}`, options) // ou ❗️❌
  }
  success(str, options){
    return this.green(`✔︎ ${str}`, options)
  }
  message(str, options){
    return this.blue(`💬 ${str}`, options) // ou 📣📢
  }
  error(str, options){
    return this.red(`❗️${str}`, options) // ou ❌
  }

  // Pour écrire le message +str+ de façon simple
  raw(str, params){
    this.log(str, params)
  }

  // Pour écrire un message 'fonctionnel', par exemple annoncer la
  // fin de tests
  func(str, opts){
    opts = opts || {format:[], size:null}
    opts.size = '11pt'
    opts.format.push('color:#777777')
    opts.column = 0
    this.write(`⚙️ ${str}`, opts)
  }
  // Pour écrire un chemin d'accès de fichier
  path(str, opts){
    opts = opts || {format:[], size:null}
    opts.size = '11pt'
    opts.format.push('color:#999999', 'text-align:right')
    this.write(str, opts)
  }
  // Pour écrire une opération
  operation(str, opts){
    opts = opts || {format:[], size:null}
    this.blue(`📐 ${str}`)
  }


  /**
    Appelé à la fin, pour remettre les méthodes normales
    de console
  **/
  onEnd(){
    console.log   = oldConsoleLog
    console.warn  = oldConsoleWarn
    console.error = oldConsoleError
  }

  // Pour écrire en rouge
  red(str, opts){
    opts = this.defaultizeOptions(opts)
    opts.format.push('color:red')
    this.write(str, opts)
  }
  green(str,opts){
    opts = this.defaultizeOptions(opts)
    opts.format.push('color:green')
    this.write(str, opts)
  }
  blue(str,opts){
    opts = this.defaultizeOptions(opts)
    opts.format.push('color:blue')
    this.write(str, opts)
  }
  orange(str,opts){
    opts = this.defaultizeOptions(opts)
    opts.format.push('color:orange')
    this.write(str, opts)
  }
  defaultizeOptions(opts){
    opts = opts || {}
    opts.format || Object.assign(opts, {format:[]})
    // Object.assign(opts, {bold:true}) // pour gras
    opts.column || Object.assign(opts,{column:3})
    return opts
  }

  // Pour écrire un titre
  titlelize(str, level){
    this.write(str, {bold:true, format:[`font-size:${this.FONT_SIZE_TITRE}`]})
  }

  /**
    Méthode qui récupère tous les messages envoyés au cours des tests
  **/
  // logStack(type, msg, args){
  logStack(){
    let args    = Array.from(arguments);
    const type  = args.shift()
    const msg   = args.shift()
    this.logstack.push({type:type, msg:msg, args:args, allArguments:arguments})
    ++this.nb_logstack
    // this.log("Stacked messages : ", this.nb_logstack)
  }

  /**
    Méthode appelée en fin de test, pour faire un petit rapport sur les
    messages interceptés dans le logstack
  **/
  endReport(){
    this.log("Nombre de messages interceptés : %d", this.nb_logstack)
    this.log("Pour voir tous les messages, jouer `showAllMessages()`")
  }

  /**
    Méthode appelée pour voir tous les messages
  **/
  showAllMessages(){
    var logmethod ;
    this.logstack.forEach(dmessage => {
      const {type,msg,args,allArguments} = dmessage
      switch(type){
        case 'error':
          logmethod = oldConsoleError
          break
        case 'warn':
          logmethod = oldConsoleWarn
          break
        case 'log':
          logmethod = oldConsoleLog
          break
      }
      if ( args ) {
        // logmethod.call(console, msg, args)
        logmethod.call(console, msg, ...args)
      } else {
        logmethod.call(console, msg)
      }
    })
  }

  /**
    Méthodes fonctionnelles
  **/
  write(msg, options){
    options = options || {}
    var params  = options.format
    params.push(`font-size:${options.size || this.FONT_SIZE}`)
    options.bold    && params.push('font-weight:bold')
    options.italic  && params.push('font-style:italic')
    options.column  && params.push(`margin-left:${options.column}em`)
    // console.log('%c'+msg, params.join(';')+';')
    this.log('%c'+msg, params.join(';')+';')
  }
  log(str, params){
    if ( params ) {
      oldConsoleLog.call(console, str, params)
    } else {
      if ( ! str ) {
        console.error()
        raise_backtrace("Problème de message vide (str) dans TConsole.log")
      }
      oldConsoleLog.call(console, str)
    }
  }
}

const iconsole = new TConsole()
console.log   = iconsole.logStack.bind(iconsole, 'log')
console.warn  = iconsole.logStack.bind(iconsole, 'warn')
console.error = iconsole.logStack.bind(iconsole, 'error')
iconsole.func("Fin de la redéfinition des méthodes console")

module.exports = iconsole
