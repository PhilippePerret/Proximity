'use strict';
/** ---------------------------------------------------------------------
  *   Class Flash

  Pour gérer les messages inscrits dans la page
  (pour les boites de dialogue, voir plutôt Dialog.js)

  # version 0.2.1
  ---------------
  # 0.2.1
      Possibilité de "nettoyer" le flash avec `flash()` ou `flash('')`
  # Version 0.2.0
      Possibilité d'indiquer de ne pas garder le texte courant
  # Version 0.1.2
      Boucle d'attente à partir d'étoile (pas encore fonctionnel)
  # Version 0.1.0
      Mise en place d'une première version fonctionnelle

  REQUIS
  ------
    Module Flash.css
    Méthodes de DOM (DCreate, DGet, etc.)

*** --------------------------------------------------------------------- */
function flash(msg,options){
  new Flash(msg,options).show()
}

class Flash {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  static show(){
    this.obj.classList.remove('noDisplay')
    this.obj.classList.remove('vanish')
    this.visible = true
  }
  static hide(){
    this.obj.classList.add('vanish')
    this.visible = false
  }

  /**
    Div flash à ajouter au conteneur général
  **/
  static add(flash, options = {}){
    this.visible || this.cleanUp()
    options.keep || this.cleanUp()
    this.flashs || (this.flashs = [])
    this.obj.append(flash.div)
    this.flashs.push(flash)

    // On lance une boucle d'attente pour pouvoir supprimer le message
    // S'il y avait déjà une boucle d'attente d'effacement, on l'arrête
    this.timer && this.stopTimer()
    this.timer = setTimeout(this.effaceMessage.bind(this), 10*1000)
    return this // pour la boucle
  }
  static effaceMessage(){
    this.stopTimer()
    this.hide()
    this.flashs.forEach(flash => flash = null)
    this.flashs = []
  }
  static cleanUp(){
    this.obj.innerHTML = ''
  }

  static stopTimer(){
    clearTimeout(this.timer)
    delete this.timer
  }

  /**
    Construction du conteneur principal qui va recevoir le message
  **/
  static build(){
    document.body.append(
      DCreate('DIV',{id:'flash', class:'noDisplay vanish'})
    )
    this.built = true
  }

  static get obj(){
    return this._obj || (this._obj = DGet('div#flash'))
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(msg,options){
    this.message = msg
    this.options = options || {}
  }

  show(){
    if ( undefined === this.message || this.message == '') {
      Flash.cleanUp()
    } else {
      this.constructor.built || this.constructor.build()
      this.constructor.add(this, this.options).show()
    }
  }

  get div(){
    return DCreate('DIV',{id:this.domId, class:'flash-message', inner:this.message})
  }

  remove(){
    this.obj.remove()
    this.constructor.hide()
  }

  /**
    TODO utiliser pour faire une boucle d'attente
  **/
  startWaitingLoop(){
    this.initialMsg = this.obj.innerHTML
    this.asterCount = 0
    this.loopTimer  = setInterval(this.loop.bind(this), 500)
  }
  loop(){
    ++ this.asterCount
    if ( this.asterCount > 15 ) {
      this.asterCount = 1
      this.obj.innerHTML = this.initialMsg
    }
    this.obj.insertAdjacentHTML('beforeend', '*')
  }
  stop(msg){
    clearInterval(this.loopTimer)
    this.loopTimer = null
    delete this.loopTimer
    this.show(msg || '---')
  }

  get obj(){
    return DGet(`div#${this.domId}`, this.constructor.obj)
  }
  get domId(){
    return this._domid || ( this._domid = `flash-${new Date().getTime()}`)
  }
}
