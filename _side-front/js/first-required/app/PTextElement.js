'use strict'
/** ---------------------------------------------------------------------
  *   Classe abstraite PTextElement
  *
*** --------------------------------------------------------------------- */
class PTextElement {

  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /**
    Écrit un message en console
  **/
  static log(msg){
    Log.write(this.name, `color:${this.consoleColor}`, msg)
  }

  /**
    Reset complet de l'élément textuel
    Si des opérations supplémentaires sont attendues, les mettre dans la
    méthode `afterReset` de la classe héritière
  **/
  static reset(){
    delete this.items
    this.items = {}
    delete this._firstitem
    delete this.minId
    delete this.lastId
    delete this._current
    if ( this.afterReset instanceof Function ) this.afterReset.call(this)
  }

  /**
    Retourne l'instance de l'élément d'identifiant +id+
  **/
  static get(id){
    if ( isNullish(id) ) return
    return this.items[Number(id)]
  }

  /*
    Items method
  */

  /**
    Retourne un nouvel ID unique pour le text-element
  **/
  static newId(){
    if ( this.minId && this.minId > 1) {
      return --this.minId
    } else {
      this.lastId || ( this.lastId = 0 ) // +1-start
      return ++ this.lastId
    }
  }

  /**
    Ajoute une instance aux instances de la classe

    Note : appelée à l'instanciation de l'objet
  **/
  static add(item){
    if (undefined === item.id) {
      item.id = this.newId()
    } else {
      // Quand l'identifiant est défini, on regarde si c'est le plus grand ou
      // le plus petit (pour pouvoir aussi prendre des identifiants inférieurs)
      if ( item.id > this.lastId ) this.lastId = Number(item.id)
      else if ( item.id < this.minId || isNullish(this.minId) ){
        this.minId = Number(item.id)
      }
    }
    Object.assign(this.items,{[item.id]: item})
  }

  /**
    Supprime un item

    Si on doit procéder à d'autre opération avant ou après, on appelle
    les méthode beforeRemove ou afterRemove
  **/
  static remove(item){
    if (this.beforeRemove instanceof Function) this.beforeRemove.call(this, item)
    delete this.items[item.id]
    if ( item.id === this.minId ) {
      ++this.minId
    } else if (item.id === this.lastId) {
      --this.lastId
    }
    if (this.afterRemove instanceof Function) this.afterRemove.call(this, item)
  }

  /**
    Passer une méthode sur chaque item
    Si la méthode retourne false, on interrompt la boucle immédiatement
  **/
  static forEachItem(method, args){
    this.treateForEachItemOf(this.itemList, method, args)
  }

  /**
    Méthode, utilisée par les instances et la classe, pour boucler la méthode
    +method+ sur tous les éléments +lesitems+ envoyés.
    Note [1] : si la méthode retourne `false`, la boucle est interrompue.

    param {Array} lesitems    Items (instances) à traiter
    param {Function}  method  Méthode à utiliser avec l'item en argument
                              => method(item)
          {String}    method  Si string, méthode d'item à utiliser
                              => item.method(args)
    param {Object}    args    Arguments optionnels à transmettre à la méthode
                              lorsqu'elle est en string.
  **/
  static treateForEachItemOf(lesitems, method, args){
    if ( 'string' === typeof method ) {
      for ( var item of lesitems ) {
        if ( false === item[method].call(item, args)) break; // [1]
      }
    } else {
      for ( var item of lesitems ) {
        if ( false === method(item, args) ) break ; // [1]
      }
    }
  }

  /**
    Retourne les items sous forme de liste
  **/
  static get itemList(){
    return Object.values(this.items)
  }

  /**
    Retourne l'index dans les items de l'item +item+
  **/
  static getIndexInParent(item){
    return Object.keys(this.items).indexOf(String(item.id))
  }

  /*
      Test methods
  */

  /**
    Méthode utilisée au cours des tests pour afficher l'état actuel des
    objets de la classe.
    NB : la console n'est plus utilisable, au cours des tests
  **/
  static exposeTest(options){
    options = options || {}
    // Note : on se sert de class.SHORTPROP2PROP pour connaitre les
    // propriétés à afficher
    let table = {}
    this.forEachItem(item => {
      // TConsole.raw(`\t\tID #${item.id}`)
      Object.assign(table, {[item.id]: item.jsonable})
    })
    const when = options.before ? ' avant' : (options.after ? ' après' : '') ;
    // TConsole.raw("table à traiter : ", table) // pour voir erreur circulaire
    TConsole.raw(`\t\tÉtats de ${this.name}.items${when}`, JSON.parse(JSON.stringify(table)))
  }

  /*
      Properties
  */

  /**
    Nombre d'instances
  **/
  static get count(){
    return Object.keys(this.items).length
  }

  /*
    Data methods
  */

  /**
    +return+::[Any] Le premier item de la liste
  **/
  static get firstItem(){
    return this.itemList[0]
  }

  /**
    +return+::[Number] ID du premier item
  **/
  static get firstItemId(){
    return this.firstItem && this.firstItem.id
  }

  /**
    Retourne l'ID du dernier mot traité ou undefined
  **/
  static get lastItemId(){
    return this.lastItem && this.lastItem.id
  }

  /**
    Dernier item de la liste
  **/
  static get lastItem(){
    const count = this.count // pour ne compter qu'une fois ici
    return count < 1
      ? null
      : this.itemList[count-1]
  }

  /**
    Retourne les données de tous les items au format JSON
  **/
  static get forJSON(){
    this.log('-> forJSON (return direct)')
    return this.itemList.map(item => item.forJSON)
  }

  /**
    On récupère les données du fichier JSON enregistré
  **/
  static fromJSON(dataItems){
    this.log('-> fromJSON')
    dataItems.forEach(dataItem => {
      try {
        var item = new this(Object.assign(dataItem,{fromJSON:true}))
        item.parent.addItem(item)
      } catch (e) {
        App.onError(e)
        console.error("[fromJSON] Problème avec les données (class:%s) :", this.name, dataItem)
      }
    })
    this.log('<- fromJSON')
  }

  /**
    Text-Element courant

    Implémenter une fonction onSetCurrent dans la sous-classe pour faire un
    traitement particulier.
  **/
  static get current(){return this._current}
  static set current(v){
    if ( this.beforeSetCurrent instanceof Function) {
      this.beforeSetCurrent.call(this)
    }
    this._current = v
    if ( this.onSetCurrent instanceof Function ){
      this.onSetCurrent.call(this, v)
    }
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(data) {
    this.items = []
    this.tableItems = {}
    // Si les data contient 'fromJSON' à true, il faut utiliser la méthode
    // fromJSONData de l'instance pour dispatcher les bonnes valeurs
    if (true === data.fromJSON) {
      this.fromJSON(data)
    } else {
      // On dispatche les données en les mettant dans des '_<property>'
      for(var k in data){
        // console.log("Je mets _%s à", k, data[k])
        this[`_${k}`] = data[k]
      }
    }
    this._ptexte || (this._ptexte = PTexte.current)
    this.constructor.add(this)

    /*
      Bindings
    */
    this.buildAndFeed && (this.buildAndFeed = this.buildAndFeed.bind(this))
    this.build        && (this.build = this.build.bind(this))
    this.feed         && (this.feed = this.feed.bind(this))

    this.fromJSON && (this.fromJSON = this.fromJSON.bind(this))
    this.forEachItem = this.forEachItem.bind(this)

  }

  /**
    Propriétés de l'objet pour les tests (vérification et affichage surtout)
  **/
  get jsonable(){
    var table = {}
    const ShortPropToProp = this.constructor.ExposableProperties
    for( var shortProp in ShortPropToProp ){
      var prop = ShortPropToProp[shortProp].prop ;
      var type = ShortPropToProp[shortProp].type ;
      var valu = this[`jsonable_${prop}`] // pour les objets qui contiennent d'autres objets par exemple
      if (undefined === valu) valu = this[`_${prop}`]
      if (undefined === valu) valu = this[`_${prop.toLowerCase()}`]
      if (undefined === valu) valu = this[prop] // en dernier recours, mais ça risque de calculer une valeur
      Object.assign(table, {[prop]:valu})
    }
    return table
  }

  /**
    Helper pour écrire une référence à l'objet
  **/
  get ref(){
    return this._ref || (this._ref = `<<${this.class.name} #${this.id}>>`)
  }

  log(msg){
    Log.write(`${this.constructor.name} #${this.id}`, `color:${this.constructor.consoleColor}`, msg)
  }

  // Pour la clarté (this.class au lieu de this.constructor)
  get class(){return this.constructor}

  /*
    Items methods
  */

  /**
    Retourne le nombre d'items de l'instance
  **/
  get count(){
    return this.items.length
  }

  /**
    Ajouter un item
  **/
  addItem(item){
    this.items.push(item)
    Object.assign(this.tableItems, {[item.id]: item})
  }

  /**
    Récupérer les items de l'instance (à partir de la donnée this._itemsIds)

    DEPRECATED
    Il faut mieux instancier l'enfant et utiliser la méthode parent.addItem
    pour l'ajouter au parent
  **/
  getItems(){
    console.warn('DEPRECATED Utiliser une autre formule pour récupérer les enfants.')
  }

  /**
    Exécute la méthode +method+ sur tous les enfants de l'instance.
    cf. treateForEachItemOf
  **/
  forEachItem(method, args){
    this.constructor.treateForEachItemOf(this.items, method, args)
  }


  /**
    Mapper la méthode +method+ sur tous les items de l'élément.
  **/
  map(method){
    return this.items.map(item => method(item))
  }

  /**
    Élément précédent de même type
  **/
  get previousSibling(){
    return this._prevItem || (this._prevItem = this.constructor.itemList[this.indexInParent - 1])
  }
  get prev(){return this.previousSibling}

  /**
    Élément suivant de même type
  **/
  get nextSibling(){
    return this._nextitem || (this._nextitem = this.constructor.get(Number(this.index||this.id)+1))
  }
  get next(){ return this.nextSibling }


  /*
    Data methods
  */

  /**
    Les données pour enregistrer l'élément (et ses items) dans un fichier
    JSON
  **/
  get forJSON(){
    this.log('-> forJSON (return direct)')
    return {
        id: this.id
      , p:  this._parentId
      , i:  this.items.map(item => item.id)
      , ro: this.relOffset
      , ao: this.absOffset
      , d:  new Date()
    }
  }

  /**
    Dispatche les données depuis le fichier JSON
  **/
  fromJSON(data){
    this._id          = data.id
    this._parentId    = data.p
    this._itemsIds    = data.i
    this._relOffset   = data.ro
    this._savedAt     = data.d
  }

  /*
    Properties
  */

  /**
    Le PTexte de l'élément
  **/
  get ptexte(){return this._ptexte}

  // /**
  //   Le parent de l'élément (pour une PPage, c'est un PCachier, pour un
  //   PPhrase, c'est une PPage, etc.)
  // **/
  // get parent() {
  //   return this._parent || (this._parent = this.parentClass.get(this._parentId))
  // }
  //
  // /**
  //   Retourne l'identifiant du parent
  // **/
  // get parentId(){
  //   return this._parentId
  // }
  //
  // get indexInParent(){
  //   if ( undefined === this._indexinparent ) {
  //     this._indexinparent = this.constructor.getIndexInParent(this)
  //   }
  //   return this._indexinparent
  // }

  /**
    Offset absolu de l'élément dans le texte
    [1]
      La méthode calcAbsOffset doit être défini par la classe qui
      hérite cette classe abstraite.
    [2]
      Pour les paragraphes, est défini directement, lors de la préparation
      (analyse) du texte.
  **/
  get absOffset(){
    return this._absOffset /*[2]*/ || this.calcAbsOffset.call(this) /*[1]*/
  }

  /**
    Décalage relatif dans le parent
  **/
  get relOffset(){ return this._relOffset }
  set relOffset(v){ this._relOffset = v ; delete this._absOffset }

  /*
    DOM Methods
  */

  get domId(){
    return this._domid || (this._domid = `${this.constructor.name.toLowerCase()}-${this.id}`)
  }

  /**
    Le div de l'élément, dans le DOM
    S'il n'existe pas, il est construit (mais pour le moment, en le plaçant
    simplement à la fin)
  **/
  get div(){
    if ( undefined === this._div) {
      this._div = DGet(`#${this.domId}`)
      this._div || this.build()
      this._div = DGet(`#${this.domId}`)
    } return this._div
  }

}
