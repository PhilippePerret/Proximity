'use strict';
/** ---------------------------------------------------------------------
  Class PFile
  -----------
  Gestion des fichiers

Dans la nouvelle formule de janvier 2020, on enregistre les paragraphes
dans des fichiers.
*** --------------------------------------------------------------------- */
class PFile {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /**
    Chargement des pages/fichiers du texte ptexte

    +Params+::
      +ptexte+::[PTexte]  Le pTexte à charger
  **/
  static load(ptexte){
    this.reset()
    this._ptexte = ptexte
    var numPage = 0 ; // commence à 1
    while(fs.existsSync(this.pathOf(++numPage))){
      PTexte.loading || raise(LOADING_ABORTED)
      var dataPage = IO.loadJSON(this.pathOf(numPage))
      var pfile = new PFile(Object.assign(dataPage,{ptexte:ptexte}))
      if ( pfile.id > this.lastId ) this.lastId = Number(pfile.id)
    }
  }

  /**
    Enregistrement de toutes les pages
    -----------------------------------
    +Params+::
      +ptexte+::  [PTexte]  Le texte analysé pour lequel il faut enregistrer les
                            pages (le plus souvent, le courant).
  **/
  static save(ptexte){
    if ( PTexte.saveLocked ) {
      console.warn('[PFile (class)] Sauvegarde verrouillée. Je ne sauve rien.')
      return
    }
    // this.items.forEach(pfile => pfile.save())
    ptexte.pages.forEach(pfile => pfile.save())
    ptexte.saveOffsets()
  }

  static newId(){
    return ++ this.lastId
  }

  /**
    Pour ajouter une page à la liste des pages
  **/
  static add(page){
    this.items.set(page.id, page)
  }

  /**
    Retourne l'instance PFile de la page d'identifiant +page_id+
  **/
  static get(page_id){
    return this.items.get(page_id)
  }

  static get count(){ return this.items.size }

  static reset(){
    delete this._folder
    delete this._ptexte
    this.lastId = 0 ; // 1-start
    this.items = new Map()
  }


  /**
    Chemin d'accès à la page numéro +numPage+
  **/
  static pathOf(numPage){
    return path.join(this.folder,`page-${numPage}.json`)
  }
  /**
    Dossier contenant les fichiers/pages
  **/
  static get folder(){
    return this._folder || (this._folder = this.ptexte.inProx('files'))
  }

  static get ptexte(){return this._ptexte}


  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(data){
    for(var k in data){ this[`_${k}`] = data[k] }
    this.id || ( this.id = this.constructor.newId())
    this.constructor.add(this)
  }

  /**
    Construction de la page/file
    i.e. construction de ses paragraphes
    On ajoute aussi un repère en début de page pour savoir où elle
    se trouve.
  **/
  build(){
    console.log("Page #%d -> build", this.id)
    UI.containerLeftPage.append(this.markPage)
    this.paragraphs.forEach(parag => parag.build())
    this.scroll = DGet(`#${this.markPageId}`,UI.containerLeftPage).offsetTop
    console.log("Page #%d (scroll:%d) <- build", this.id, this.scroll)
  }

  get markPage(){
    return DCreate('DIV',{id:this.markPageId, class:'page-mark'})
  }
  get markPageId(){
    return this._markpageid || (this._markpageid = `page-mark-${this.id}`)
  }

  /**
    Sauvegarde du fichier
    ---------------------
    Attention : son offset (et sa longueur plus tard) doivent être sauvés de
    façon séparée par la méthode PTexte#saveOffsets, mais comme cette méthode
    peut-être appelée en rafale (pour sauver tous les fichiers) il faut bien
    préciser +saveOffset+

    +Params+::
      +saveOffsets+:: [Boolean]  SI true, on sauve le fichier offsets
  **/
  save(saveOffsets = false){
    if ( PTexte.saveLocked ) {
      console.warn(`[PFile #${this.id}] Sauvegarde verrouillée. Je ne sauve rien.`)
      return false
    }
    // console.log("Sauvegarde du fichier #%d dans '%s'", this.id, this.path)
    var paragraphsAsJson = []
    for(var parag of this.paragraphs){
      paragraphsAsJson.push(parag.asJSON)
    }
    IO.saveJSON(this.path, {
        id:         this.id
      , dataParagraphs: paragraphsAsJson
    })
    // Sauver le fichier général des offsets
    saveOffsets && this.ptexte.saveOffsets()
    return true
  }

  /**
    Retourne la page/pfile suivante ou undefined si elle n'existe pas
  **/
  get next(){
    return this.constructor.get((this.index||this.id) + 1)
  }
  /**
    +return+::[PFile] La page précédente
  **/
  get prev(){
    return this.constructor.get((this.index||this.id) - 1)
  }


  get path(){
    return this._path || (this._path = path.join(this.ptexte.pagesFolder,`page-${this.id}.json`))
  }

  // Pour la compatibilité avec les autres éléments (paragraphes, mots, etc.)
  get absOffset(){return this.offset}

  /*
  */
  get ptexte(){return this._ptexte}

  /*
    Propriétés enregistrées
  */
  get id(){return this._id}
  set id(v){ this._id = v}
  get offset(){return this._offset}
  set offset(v){this._offset = v}
  get length(){ return this._length }
  set length(v){ this._length = v}


  /**
    Méthodes de traitement des PARAGRAPHES
  **/
  get paragraphs(){return this.__paragraphs}

  /**
    Ajout d'un paragraphe (pour le moment, à la préparation)
    +Params+::
      +parag+:: [PParagraph] Instance du paragraphe à ajouter
  **/
  addParagraph(parag){
    this.__paragraphs = this.__paragraphs || []
    this.__paragraphs.push(parag)
  }

  set _dataParagraphs(dParags){
    var curRelOffset = 0
    this.__paragraphs = []
    dParags.forEach(dparag => {
      const iparag = new PParagraph(Object.assign(dparag,{fileId:this.id}))
      this.__paragraphs.push(iparag)
    })
  }
  // Pour gérer les vieux fichiers (< 0.5.0)
  set _paragraphs(v){
    this._dataParagraphs = v
  }


}
