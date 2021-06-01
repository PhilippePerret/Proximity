'use strict'
/**
  Class UIObject
  verson 1.1.1
  --------------
  Gestion des objets DOM

  # version 1.1.1
    * amélioration de la méthode 'append' pour qu'elle puisse recevoir des
      paramètres, pour le moment le style (class CSS) du message.

  # version 1.1.0
    * amélioration générale

  # version 1.0.0.
    * première version utilisable

**/
class UIObject {
  constructor(selector){
    this.selector = selector
  }

  // Ajoute le contenu +contenu+ (string ou HTMLElement)
  // Retourne l'objet lui-même pour pouvoir chainer :
  //  objet.append(...).append(...).append etc.
  append(contenu, options){
    if ( 'string' === typeof options ) { options = {css: options}}
    else if ( undefined === options ) options = {}
    if ( 'string' === typeof contenu) {
      contenu = contenu.replace(/\n/g, '<br>')
      if ( options.css ) contenu = `<span class="${options.css}">${contenu}</span>`
      this.domObj.insertAdjacentHTML('beforeend', contenu)
    } else {
      if (!isArray(contenu)){ contenu = [contenu] }
      contenu.forEach(el => this.domObj.appendChild(el))
    }
    return this
  }

  /**
    Afficher
  **/
  show(){
    this.domObj.classList.remove('noDisplay')
  }

  /**
    Masquer
  **/
  hide(){
    this.domObj.classList.add('noDisplay')
  }
  
  /**
    Ajoute l'objet dans le container +container+
  **/
  appendIn(container){
    container.appendChild(this.domObj)
  }
  /**
    Retourne l'élément de selector +selector+ contenu par l'élément courant
  **/
  find(selector){
    return this.domObj.querySelector(selector)
  }
  findAll(selector){
    return this.domObj.querySelectorAll(selector)
  }

  // Vide
  // @return l'objet (pour chainage)
  clean(){this.domObj.innerHTML = ''; return this}

  get jqObj(){return this._jqObj||(this._jqObj = $(this.selector))}
  get domObj(){return this._domObj||(this._domObj = document.querySelector(this.selector))}

  set value(v){this.jqObj.val(v)}
  get value(){return this.jqObj.val()}
}
