'use strict'
/** ---------------------------------------------------------------------
  Class PParagraph
  ----------------
  Gestion des paragraphes


Dans la nouvelle formule (janvier 2020), on procède par paragraphes.

La propriété `mots` des instances contient toutes les instances PMot du
texte.
*** --------------------------------------------------------------------- */
class PParagraph extends PTextElement {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */
  static consoleColor(){return '#78DF9E'}

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(data){
    // console.log("Instanciation PParagraph avec data = ", data)
    super(data)
  }

  reset(){
    delete this._file
    delete this._absOffset
    delete this._length
  }

  forEachMot(method){
    var i = -1
    while(this.mots[++i]){
      if ( false === method(this.mots[i]) ) break
    }
  }

  /**
    Construction d'un paragraphe
    Ça revient à mettre tous ses mots dans un div
  **/
  build(output = 'interface' /* pourra être 'file' TODO */ ){
    if ( output === 'interface' ) {
      UI.containerLeftPage.append(this.buildDiv())
      this.mots && this.mots.forEach(mot => mot.afterBuild())
    }
  }

  buildDiv(){
    try {
      return DCreate('DIV',{
          id:           this.domId
        , 'data-id':    this.id
        , 'data-file':  this.fileId
        , class:        'paragraph'
        , inner:        this.motsAsSpan()
      })
    } catch (e) {
      // Ça arrive quand on a aborté le chargement
      // On laisse ça silencieux
      console.warn("PParagraph.buildDiv interrompu.")
    }
  }

  /**
    Pour insérer le mot +mot+ après le mot +after+

    Attention : la méthode peut être appelée "en rafale" (lorsque plusieurs
    mots sont insérés d'un seul coup), donc il faut se contenter d'un
    traitement simple.

    +Params+::
      +mot+:: [PMot] Mot à insérer dans les mots du paragraph
      +after+:: [PMot] Mot, appartenant au paragraphe, après lequel il faut
          insérer +mot+
  **/
  insertAfter(mot, after){
    mot || raise(`Il faut fournir le mot à insérer !`)
    mot instanceof(PMot) || raise(`Le mot à insérer devrait être de classe PMot.`)
    after || raise(`Il faut indiquer après quel mot insérer le mot.`)
    after instanceof(PMot) || raise(`le mot “after” devrait être de classe PMot.`)
    after.paragraphId == this.id || raise(`Le mot #${after.id} '${after.real}' n'appartient pas au paragraphe #${this.id}`)
    this.__mots.splice(this.indexOf(after)+1,0, mot)
    delete this._length
  }

  /**
    Détruire le mot de la liste
    (note : rien besoin de faire d'autre, les idN et idP des mots autour
     doivent avoir été traités par la méthode appelante)
    Note 2
      Il faut aussi penser à sauver le fichier contenant le paragraphe
  **/
  remove(mot){
    this.__mots.splice(this.indexOf(mot),1)
    delete this._length
    this.ptexte.updateOffsetFrom(mot,false/*interactive*/,true/*updateProximites*/)
  }

  /**
    Retourne l'index du mot +mot+
  **/
  indexOf(mot){
    mot || raise(`Il faut fournir le mot à insérer !`)
    mot instanceof(PMot) || raise(`Le mot à insérer devrait être de classe PMot.`)
    mot.paragraphId == this.id || raise(`Le mot #${mot.id} '${mot.real}' n'appartient pas au paragraphe #${this.id}. Impossible de retourner son index…`)
    const motsCount = this.mots.length
    for(var i = 0; i < motsCount; ++i){
      if ( this.mots[i].id == mot.id ) { return Number(i) } // on doit le trouver forcément
    }
  }

  motsAsSpan(){
    return this.mots ? this.mots.map( mot => mot.build() ) : ['']
  }

  get obj(){
    return this._obj || (this._obj = DGet(`#${this.domId}`))
  }

  get domId(){
    return this._domid || (this._domid = `paragraph-${this.id}`)
  }

  /**
    Retourne le début du paragraphe
  **/
  get debut(){
    var segment = ''
    var segmentLen = 0
    var mot = this.mots[0]
    while ( mot && segmentLen < 50 ) {
      segment += (mot.before||'')+mot.real+(mot.tbw)
      segmentLen += mot.totalLength
      mot = mot.next
    }
    return segment
  }
  /**
    Données à enregistrer dans le fichier
  **/
  get asJSON(){

    this.data = {
        type: 'pparagraph'
      , id: this.id
      // L'offset et la longueur sont maintenant définis dans un fichier
      // séparé (pour accélérer l'enregistrement des longs textes).
      // , relOffset: this.relOffset
      // , length: this.length
      , mots: []
      // , fileId: this.fileId
    }
    // console.log("PParagraph#%s, mots = ", this.id, this.mots)
    this.forEachMot( mot => {
      delete mot.isNew
      this.data.mots.push(mot.forJSON)
    })

    return this.data
  }

  /**
    Définit les mmots du paragraphe (this.mots)
    +Params+::
      +dataMots+::[Array] Une liste de données de mots transmise lors de la
          préparation du texte.
      +prevMot+::[PMot|Undefined]  Le mot précédent
  **/
  setMots(dataMots, prevMot){
    var newMot ;
    var idPrevious ;
    this.__mots = dataMots.map(dmot => {
      idPrevious = prevMot && prevMot.id
      Object.assign(dmot, {
          paragraphId:this.id
        , idP: idPrevious
      })
      newMot = new PMot(dmot)
      // Si le mot précédent est défini, on définit son idN
      prevMot && (prevMot._idN = newMot.id)
      // On prend le nouveau mot précédent
      prevMot = newMot
      return newMot
    })
    // return dataMots[dataMots.length - 1]
  }

  get mots(){return this.__mots}
  set mots(v){ this._mots = v }
  set _mots(v){
    const frjson = !!(v[0] && v[0].r)
    this.__mots = v.map( dmot => {
      return new PMot(Object.assign(dmot,{fromJSON:frjson}))
    })
  }

  /**
    +return+ [PFile] Le fichier contenant le paragraphe
  **/
  get file(){
    return this._file || (this._file = PFile.get(this.fileId) )
  }
  get page(){ return this.file } // alias

  /**
    Retourne l'offset relatif du paragraphe
    Noter que :
      - il est indéfini à la création, à l'analyse du fichier (cf. la raison
        dans les notes de calcRelOffset)
      - il est défini à la lecture des données (c'est lui qui est enregistré)
  **/
  get relOffset(){ return this._relOffset }
  set relOffset(v){ this._relOffset = v; delete this._absOffset }

  /**
    Calcule et retourne le décalage absolu du paragraphe
    +return+::[Number] Décalage absolu du paragraphe dans le texte
  **/
  calcAbsOffset(){
    // console.log("this.fileId=%d, this.file = ", this.fileId, this.file)
    return this.relOffset + this.file.offset
  }

  /**
    À la première analyse du texte, on connait l'offset absolu du paragraphe
    mais on ne connait pas son offset relatif à son fichier (tout simplement
    parce qu'on ne connait pas son fichier). Avant l'enregistrement, cette
    méthode va donc calculer cet offset relatif.
  **/
  calcRelOffset(){
    return this.absOffset - this.file.offset
  }

  /**
    +return+ [Number] L'identifiant du fichier contenant le paragraphe
    (peut s'appeler aussi "numéro de page")
  **/
  get fileId(){return this._fileId}
  set fileId(v){
    this._fileId = v
    this.reset()
  }

  get originalText(){return this._originalText}

  get length(){
    return this._length || (this._length = this.calcLength())
  }
  set length(v){ this._length = v }

  /**
    Retourne la longueur calculée du paragraphe
    [1] Le retour chariot final
  **/
  calcLength(){
    if ( this.originalText ) {
      return this.originalText.length + 1 // [1]
    } else {
      var len = 0 ;
      this.forEachMot(mot => len += mot.totalLength )
      return len + 1 // [1]
    }
  }

}
