'use strict'
/**
  Dom
  version: 1.2.4

  # 1.2.4
      Simplification. Abandon de l'utilisation des touches clavier,
      trop problématique.
  # 1.2.0
      Séparation de l'objet Dom
  # 1.1.0
      Classe DMenu
  # 1.0.1
      Récupération des travaux précédents
**/

/** ---------------------------------------------------------------------
  *   DMenuGroup
  *   ----------
  *   Gestion des "groupes de menus"

Un "groupe de menus" est un ensemble uniforme de menus [DMenu] qui
fonctionnent ensemble. Fonctionner ensemble signifie par exemple qu'ils
partagent la ou les sélections courantes, qu'ils réagissent ensemble aux
touches flèches, etc.

REQUIS
------
  * Les menus se masquent avec la classe 'noDisplay'

FERMETURE DE LA BOITE PROPRIÉTAIRE
----------------------------------
  Par défaut, un click sur un des menus du groupe appel la
  méthode 'this.owner.hide()' qui doit, normalement, fermer le
  popup. Pour empêcher ce comportement, utiliser dans le owner :
    this.groupMenus.options.closeOnClick = false

*** --------------------------------------------------------------------- */
class DMenuGroup {

  /**
    Instanciation du groupe de menus
    +Params+::
      +owner+:: [Any]   Le propriétaire. Peut-être tout et n'importe quoi
      +dataMenus+:: [Array] Liste des données des menus, dans l'ordre où ils
                            doivent apparaitre. Cf. plus bas les exigences
                            pour DMenu puisque ces données doivent permettre
                            de faire les instances DMenu
  **/
  constructor(owner, dataMenus){
    this.owner = owner
    this.dataMenus = dataMenus

    dataMenus && this.setInstancesMenus()

    this.onKeyUp    = this.onKeyUp.bind(this)
    this.observe    = this.observe.bind(this)
    this.unobserve  = this.unobserve.bind(this)

    this.menusObserved = false

  }

  /**
    +return+::[DMenu] Instance du menu d'identifiant +menu_id+
  **/
  get(menu_id){ return this.map.get(menu_id) }

  activate(){
    this.obj.focus()
    this.obj.addEventListener('keyup', this.realKeyUp.bind(this))
  }
  desactivate(){
    this.obj.blur()
    this.obj.removeEventListener('keyup', this.realKeyUp.bind(this))
  }

  realKeyUp(ev){
    console.log("Touche %s sur realKeyUp", ev.key)
  }
  /**
    Méthode permettant de boucle avec une fonction sur les
    menus du groupe, dans l'ordre de leur définition.

    +Params+::
      +method+::[String|Function] La méthode à faire tourner.
        Soit c'est une méthode explicite dont le premier argument doit être
        le DMenu, soit c'est le nom string d'une méthode du menu.

    Note : je ne sais pas pourquoi ça ne marche pas avec this.menus alors
    que this.menus est censé être égal à this.map.values()
  **/
  forEach(method){
    if ( method instanceof Function ) {
      for(var menu of this.map.values()){
        if ( false === method.call(null, menu) ) break ;
      }
    } else /* string */ {
      for(var menu of this.map.values()){
        if ( false === menu[method].call(menu) ) break ;
      }
    }
  }

  selectPrevMenu(){
    if ( undefined === this._iselected ) this._iselected = 0
    this.iselected = this._iselected - 1
    this.selectCurrentMenu()
  }

  selectNextMenu(){
    if ( undefined === this._iselected ) this._iselected = -1
    this.iselected = this._iselected + 1
    this.selectCurrentMenu()
  }

  selectCurrentMenu(){
    this.selected.select()
  }

  /**
    On simule un clique sur l'item de menu
  **/
  activateCurrentMenu(){
    this.selected && this.selected.obj.click()
  }

  /**
    Retourne le menu [DMenu] sélectionné
  **/
  get selected() {return this._selected || (this._iselected && this.realMenusList[this._iselected])}
  set selected(v){this._selected = v}

  /**
    Retourne l'index du menu sélection
  **/
  get iselected() {return this._iselected}
  set iselected(v){
    // console.log("v = ", v)
    // On déselectionne tout comme un bourrin
    this.forEach(menu => {menu.isSelected && menu.deselect()})
    delete this._iselected

    const realsize = this.realSize

    if ( v < 0 ) { v = realsize - 1 }
    else if ( v > realsize - 1 ) { v = 0 }

    this._iselected = v
    this.selected   = this.realMenusList[this._iselected]
    // console.log("menusList, this._iselected", this.realMenusList, this._iselected)
    // console.log("DMenuGroup#selected est ", this.selected)
  }

  /**
    Alors que this.size retourne la vraie quantité de menus, this.realSize
    retourne le nombre de menus visible (non hidden)
  **/
  get realSize(){
    return this.realMenusList.length
  }
  get realMenusList(){
    if ( undefined === this._realmenuslist){
      var newList = []
      this.menusList.forEach(menu => {menu.hidden || newList.push(menu)})
      this._realmenuslist = newList
    } return this._realmenuslist
  }

  resetRealMenusList(){
    delete this._realmenuslist
  }

  /**
    Construction du groupe de menus
  **/
  build(){
    var spans = []
    this.forEach(menu => spans.push(menu.domObj))
    return DCreate('DIV', {
        class: 'menugroup'
      , id: this.domId
      , inner: spans
    })
  }

  get obj(){return this._obj || (this._obj = DGet(`#${this.domId}`))}
  get domId(){return this._domid || (this._domid = `menugroup-${Number(new Date())}`)}
  /**
    Observation du groupe de menus
    ------------------------------
      - observation de chaque DMenu
      - methode de captation des keyUp sur la fenêtre
  **/
  observe(){
    this.menusObserved || this.observeMenus()
    // window.onkeyup = this.onKeyUp
  }

  unobserve(){
    // Je n'utilise pas les touches clavier pour le moment
    // window.onkeyup = null
  }

  observeMenus(){
    this.forEach('observe')
    this.menusObserved = true
  }

  onKeyUp(ev){
    // var scrolling
    // ev.stopPropagation()
    // ev.preventDefault()
    // switch(ev.key){
    //   case 'ArrowUp':
    //     this.selectPrevMenu()
    //     break
    //   case 'ArrowDown':
    //     this.selectNextMenu()
    //     break
    //   case 'Enter':
    //     this.activateCurrentMenu()
    //     break
    // }
    // window.scrollTo(0,this.owner.scrolling)
    return stopEvent(ev)
  }

  /**
    Instanciation des menus
  **/
  setInstancesMenus(){
    this._map = new Map()
    var index = 0
    this.dataMenus.forEach(dm=>{this._map.set(dm.id, new DMenu(this,Object.assign(dm,{index:index++})))})
  }

  get options(){
    if (undefined === this._options ){
      this._options = {
        closeOnClick: true
      }
    } return this._options ;
  }

  get size(){ return this.map.size}
  get menusList(){
    return this._menusList || (this._menusList = Array.from(this.map.values()))
  }
  get menus(){ return this._menus || (this._menus = this.map.values()) }
  get map(){ return this._map }

}


class DMenu {
  /**
    Instanciation
    -------------
    Soit le menu appartient à un groupe de menus (DMenuGroup) soit il appartient
    à un propriétaire quelconque.
    Si +group+ n'est pas un DMenuGroup, les deux valeurs this.group et
    this.owner sont identiques, ce qui peut poser certains problèmes. Le mieux
    est de toujours passer par un groupe de menus qui fonctionnent ensemble.
  **/
  constructor(group, data){
    if ( group instanceof DMenuGroup) {
      this.group = group
      this.owner = group.owner
    } else {
      this.group = group
      this.owner = group
    }
    this.owner      || raise(loc('error.dmenu.owner.required'))
    // On dispatche les données
    for(var k in data){this[`_${k}`]=data[k]}
    this.owner[this.observer] instanceof(Function) || raise(loc('error.dmenu.owner.should-respond-to', {observer:this.observer}))
    this.id         || raise(loc('error.dmenu.id.required'))
    this.observer   || raise(loc('error.dmenu.observer.required'))
    this.text       || raise(loc('error.dmenu.text.required'))

    this.observe    = this.observe.bind(this)
    this.unobserve  = this.unobserve.bind(this)
    this.select     = this.select.bind(this)
    this.deselect   = this.deselect.bind(this)
    this.onClick    = this.onClick.bind(this)
  }

  /**
    Pour afficher ou masquer l'élément
  **/
  show(){
    this.removeClass('noDisplay')
    this.hidden = false
    this.group.resetRealMenusList()
  }
  hide(){
    this.addClass('noDisplay')
    this.hidden = true
    this.group.resetRealMenusList()
  }

  /**
    Pour ajouter ou retirer des classes
  **/
  addClass(css){ this.obj.classList.add(css)}
  removeClass(css){ this.obj.classList.remove(css)}

  /**
    Retourne le div du menu
  **/
  get domObj(){
    return this._domobj || (this._domobj = this.build())
  }

  observe(){
    this.obj.addEventListener('click', this.onClick)
  }
  unobserve(){
    this.obj.removeEventListener('click', this.onClick)
  }

  onClick(ev){
    ev && stopEvent(ev)
    this.group.iselected = this.index
    this.select()
    this.owner[this.observer].call(this.owner)
    if ( this.group.options.closeOnClick ) this.owner.hide()
    return false
  }

  build(){
    return DCreate('DIV', {class:this.classes, inner:this.text})
  }

  select(){
    // this.addClass('selected')
    this.isSelected = true
  }
  deselect(){
    // this.removeClass('selected')
    this.isSelected = false
    // this.group.iselected = null // NON ça ferait une boucle sans fin
  }

  /*
    Volatile properties
  */

  get index() { return this._index }
  set index(v){ this._index = v    }

  get classes(){
    var c = ['menu']
    c.push(this.id)
    this.class && c.push(this.class)
    return c.join(' ')
  }

  get obj(){
    return this._obj || ( this._obj = DGet(`div.${this.id}`, this.owner.obj))
  }

  get text(){return this.obj.innerHTML}
  set text(v){this.obj.innerHTML = v}

  /*
    Fix properties
  */

  get id(){return this._id}
  get text(){return this._text}
  get class(){return this._class}
  get observer(){return this._observer}
}
