'use strict'
/** ---------------------------------------------------------------------
  *   Classe MiniAide
  *   Version 0.0.1

Classe qui permet d'afficher des mini panneaux d'aide au survol de certaines
parties de l'interface ou quand on clique sur des boutons d'aide.

REQUIS
------
  * Fichier CSS css/MiniAide.css
  * L'application doit définir DATA_MINI_AIDE qui contient les messages
    d'aide. C'est une constante de cette forme :
      DATA_MINI_AIDE = {
        <id aide>: {
            title: '<titre de l’aide>'
          , content: "<contenu de l'aide>"
        }
      }

FONCTIONNEMENT
--------------
  Le plus simple est d'avoir un bouton qui contient un attribut 'data-id'
  contenant l'identifiant de l'aide et d'appeler la méthode `observeButton` en
  lui fournissant le bouton en argument pour le faire observer.

*** --------------------------------------------------------------------- */
if ('undefined' === typeof(DATA_MINI_AIDE)) DATA_MINI_AIDE = {}
class MiniAide {

  /**
    Méthode principale qui affiche l'aide d'identifiant aideId

    param {Object} ev       L'évènement contenant les positions de la souris
    param {String} aideId   L'identifiant de l'aide à appeler
  **/
  static show(aideId, ev){
    const dataAide = DATA_MINI_AIDE[aideId]
    if ( dataAide ) {
      this.built || this.build()
      this.title   = dataAide.title
      this.content = dataAide.content
      this.window.classList.remove('noDisplay')
      this.window.style.top   = `${ev.clientY}px`
      this.window.style.left  = `${ev.clientX}px`
    } else {
      console.error("L'identifiant d'aide `%s` est inconnu.", aideId)
    }
  }

  static hide(){
    this.window.classList.add('noDisplay')
  }


  /**
    Pour observer le bouton d'aide {HTMLElement} +obj+
  **/
  static observeButton(obj) {
    obj.addEventListener('click', this.onClickButton.bind(this, obj))
  }

  /**
    Quand on clique sur un bouton aide de l'interface
    Note : ce bouton doit impérativement avoir un attribut 'data-id' qui
    contient l'identifiant de l'aide
  **/
  static onClickButton(obj, ev){
    var aideId = obj.getAttribute('data-id')
    this.show(aideId, ev)
  }

  /**
    Quand on clique sur la fenêtre d'aide
  **/
  static onClick(){
    this.hide()
  }
  /**
    Construction de la fenêtre qui va afficher la mini-aide
  **/
  static build(){
    var wnd = DCreate('DIV',{id:'mini-aide', class:'noDisplay', inner:[
        DCreate('DIV', {id: 'mini-aide-title'})
      , DCreate('DIV', {id: 'mini-aide-content'})
    ]})
    document.body.appendChild(wnd)
    wnd.addEventListener('click', this.onClick.bind(this))
    this.built = true
    return wnd
  }

  /**
    Le champ du titre
  **/
  static get objTitle(){return this._objtitle || (this._objtitle = DGet('#mini-aide-title'))}
  static set title(v){this.objTitle.innerHTML = v}

  /**
    Le champ de contenu
  **/
  static get objContent(){return this._objcontent || (this._objcontent = DGet('#mini-aide-content'))}
  static set content(v){this.objContent.innerHTML = v}
  
  /**
    La fenêtre de la mini-aide
  **/
  static get window(){
    return this._window || (this._window = DGet('#mini-aide'))
  }
}
