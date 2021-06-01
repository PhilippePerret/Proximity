'use strict'
/** ---------------------------------------------------------------------
  *   Classe PMot
  *   -----------
  *   Gestion des mots
  *
*** --------------------------------------------------------------------- */
class PMot extends PTextElement {

  static get SHORTPROP2PROP(){
    if (undefined === this._shortprop2prop){
      this._shortprop2prop = {
          'b': {prop:'before',        type:'string'}
        , 'c': {prop:'canon',         type:'string'}
        , 'i': {prop:'id',            type:'number'}
        , 'n': {prop:'idN',           type:'number'}
        , 'o': {prop:'relOffset',     type:'number'}
        , 'p': {prop:'paragraphId',   type:'number'}
        , 'r': {prop:'real',          type:'string'}
        , 's': {prop:'state',         type:'number'}
        , 't': {prop:'tbw',           type:'string'}
        , 'v': {prop:'idP',           type:'number'}
        , 'x': {prop:'px_idP',        type:'number'}
        , 'z': {prop:'px_idN',        type:'number'}
      }
    }
    return this._shortprop2prop ;
  }

  static get ExposableProperties(){
    if (undefined === this._exposableproperties) {
      this._exposableproperties = Object.assign({}, this.SHORTPROP2PROP)
    }
    return this._exposableproperties ;
  }

  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /**
    Couleur pour les messages
  **/
  static get consoleColor(){
    return 'green'
  }

  static get firstMot(){ return this.firstItem }

  /*
    Data I/O methods
  */

  /**
    Pour instancier un mot {PMot}
    avec les données relevées dans les fichiers mots-page-xx.json
  **/
  static fromJSONFile(data){
    var mot = new this(Object.assign(data,{fromJSON:true}))
    if (undefined === mot.paragraph){
      console.error("Le parent du mot #%d n'est pas défini (avec les données ci-après)", mot.id, data)
    } else {
      mot.paragraph.addItem(mot)
    }
    this.lastId > mot.id || (this.lastId = Number(mot.id))
  }

  static get proxToolbox(){
    if (undefined === this._proxtoolbox){
      this._proxtoolbox = new ProxToolBox(PTexte.current)
    } return this._proxtoolbox;
  }

  /**
    Quand le mot définit _px_idP ou _px_idN, il faut vérifier la validité
    des informations de la proximité.

    Si _px_idP est défini, ça signifie que le mot est en proximité avec
    un mot AVANT lui. il est donc les motB de sa proximité
  **/
  static checkProximityFor(imot, NorP){
    // console.log("checkProximityFor(imot=, NorP='%s')", NorP, imot)
    const proxId  = imot[`_px_id${NorP}`]
    const prox    = imot[`prox${NorP}`]
    // La proximité doit exister
    prox || raise(`La proximity #${proxId} devrait exister…`)
    // Le motA ou motB de la proximité doit correspondre au mot
    const propMot = `mot${NorP=='P'?'B':'A'}`
    // console.log("propMot (proximité) : '%s'", propMot)
    const mot = prox[propMot]
    // console.log("Le mot%s de la proximité :", propMot, prox)
    mot.id == imot.id || raise(`Le ${propMot} de la proximité #${prox.id} devrait être le mot checké.`)
    return true ; // pas vraiment utile
  }

  /**
    Insertion d'un mot après un autre
    ---------------------------------
    NOTE
      La méthode ne recalcule rien au niveau des proximités (car elle
      peut être appelée en rafale). C'est à la méthode appelante de le
      faire.

    +Params+::
      +dMot+::  [Object]  Les données du mot telles que son canon string et
                          son tbw.
      +afterMot+:: [PMot] L'instance du mot après lequel il faut insérer le mot.
  **/
  static insertAfter(dMot, afterMot){
    var imot ; // instance PMot
    if ( 'object' === typeof dMot ) {
      // dMot définit le canon et le tbw notamment
      delete dMot.relOffset
      delete dMot.canon_alt
      Object.assign(dMot, {after:afterMot})
    } else {
      raise(loc('pmot.insert.error.invalid-new-word'))
    }

    const firstMot = PMot.get(afterMot.id)
    const nextMot  = PMot.get(afterMot.idN)

    // console.log("Avant createAfter, dMot = ", dMot)
    imot = imot || this.createAfter(dMot.real, dMot)

    // Si le mot suivant existe, il faut régler son idP pour que ce
    // soit le mot inséré
    nextMot && ( nextMot.idP = imot.id )

    // On doit rectifier l'idN du mot précédent (after)
    afterMot.idN = imot.id

    // On contrôle que tout soit OK
    try {
      ;(firstMot.next && firstMot.next.id == imot.id) || raise('first-mot-bad-next')
      ;(imot.next && nextMot && imot.next.id == nextMot.id) || raise('inserted-bad-next')
      ;(nextMot && nextMot.prev && nextMot.prev.id == imot.id) || raise('next-mot-bad-prev')
      ;(firstMot && imot.prev && imot.prev.id == firstMot.id) || raise('inserted-bad-prev')
    } catch (e) {
      var msg = loc('pmot.insert.error.bad-insertion', {raison:loc(`pmot.insert.error.${e}`)})
      console.error("Word before : ", firstMot)
      console.error("Inserted    : ", imot)
      console.error("Word after  : ", nextMot)
      raise(msg)
    }

    // On ajoute le mot à la liste des mots du paragraphe
    imot.paragraph.insertAfter(imot, afterMot)

    // On crée le mot dans le dom
    const paragraph = imot.paragraph
    paragraph.obj.insertBefore(imot.build(), afterMot.obj.nextSibling)
    imot.observe()

    // console.log("Mot inséré : ", imot)

    return imot ; // pour (en)chainer par exemple
  }

  /**
    Crée une nouvelle instance de mot à partir du string +motStr+
    +return+::[PMot] Le nouveau PMot créé

    Noter que l'instanciation ajoute automatiquement le mot à son
    canon.
    SAUF QUE : pour le moment, comment faire pour créer le mot sans
    connaitre son offset ? ni le paragraphe dans lequel il se trouve ?

    +Params+::
      +motStr+::[String]  Le mot string à créer
      +data+::[Object]    Table des données indispensables
                          paragraphId   ID du paragraphe dans lequel créé le mot
                          relOffset     Offset relatif du mot dans ce paragraphe
  **/
  static createAfter(motStr, data){
    // Vérification préliminaires (implémentation)
    data || raise(loc('pmot.create.error.data-required'))
    data.after || raise(loc('pmot.create.error.after.required'))
    ;(data.after instanceof PMot) || raise(loc('pmot.create.error.after.must-be-pmot-instance'))

    const after = data.after
    delete data.after
    const canon = PCanon.getOrCreateForMot(motStr)
    Object.assign(data, {
        id:this.newId()
      , real:motStr
      , relOffset: after.relOffset+after.totalLength
      , icanon:canon
      , paragraphId:after.paragraphId
      , idP:after.id
      , idN:after.idN
      , isNew:true
    })
    // console.log("dans createAfter, data pour créer l'instance = ", data)
    return new this(data)
  }

  /**
    Méthode appelée avant de détruire l'item du mot
  **/
  static beforeRemove(item){
    // On "colle" les mots avant et après
    item.motP && (item.motP.idN = item.idN)
    item.motN && (item.motN.idP = item.idP)

    // Retrait du canon
    // Note : ça recalcule les proximités en retirant celles-ci
    item.icanon.remove(item)
    // Retrait du DOM
    item.obj.remove()
    // Retrait de son paragraph
    item.paragraph.remove(item)

  }

  static afterRemove(item){
    item.save() // sauvegardera tout
    // Il ne faut pas détruire l'instance car on peut en avoir besoin
    // pour d'autres méthodes
    // item = null
  }

  static get ptexte(){ return this._ptexte || PTexte.current}

  static afterReset(){
    delete this._proxtoolbox
    delete this._ptexte
  }


  /** ---------------------------------------------------------------------
    *
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */

  constructor(data){
    super(data)

    if ( !this.real ) raise("Mot mal défini : pas de this.real")

    /*
      Bindings
    */
    this.onMouseOver    = this.onMouseOver.bind(this)
    this.onMouseOut     = this.onMouseOut.bind(this)
    this.onClick        = this.onClick.bind(this)
    this.showInfosProx  = this.showInfosProx.bind(this)
    this.hideInfosProx  = this.hideInfosProx.bind(this)

    // On l'ajoute à son canon, sauf si c'est un tout nouveau mot
    if ( this.isNew ) {
      this.icanon.insert(this, false /* update proxs */)
    } else {
      this._icanon = PCanon.addMot(this)
    }

    // Pour connaitre le dernier identifiant utilisé
    if ( this.id > (this.constructor.lastId||0) ) {
      this.constructor.lastId = Number(this.id)
    }

    // console.log("Instanciation du mot #%d '%s'", this.id, this.real)
  }

  /**
    Pour forcer les recalculs
    Par exemple après que l'offset a été rectifié
  **/
  reset(){
    delete this.infosProxBox
    delete this._absOffset
    delete this._motp
    delete this._motn
  }

  /*
    DOM methods
  */

  /**
    Construction du mot
  **/
  build(){
    // this.log('-> build')
    return DCreate('SPAN', {id:`mot-${this.id}`, class:'cmo', inner:this.asDom})
    // this.log('<- build')
  }

  afterBuild(){
    this.observe()
        this.hasProximites
    &&  this.isProximizable
    &&  this.proximitize()
  }

  /**
    Remplacement du mot courant
    ---------------------------
    - Ce remplacement peut se faire qu'il y ait ou non des proximités induites
    - newReal est toujours un mot unique (le traitement avec plusieurs mots
      doit se faire par un autre méthode)

    Ce qu'il faut faire :
      - Si le canon change :
        + retirer le mot de son ancien canon
        + placer le mot dans son nouveau canon (à l'endroit juste)
        + changer la valeur de l'attribut 'data-canon' du span du mot
        + sauver les canons
      - Changer le mot dans l'interface
        + Changer le mot écrit dans son span
      + Supprimer les éventuels proximités du mot
      + Checker si proximité et :
        + créer une nouvelle proximité si c'est le cas
        + Sauver les proximités
      + Sauver le fichier du mot

      Pour le moment :
        ça garde la proximité entre les mots à l'intérieur desquels le
        mot a été inséré (dans son nouveau canon)
        ça ne remet pas la proximité entre les deux mots avec lesquels
        le mot était en proximité (if any) dans l'ancien canon

    +Params+::
      +newReal+:: [String] Le nouveau mot à utiliser
      +canon+::   [PCanon] Son canon, existant ou créé
      +saving+::  [Boolean] Si TRUE, on enregistre tout tout de suite (fichier
                            du mot, canons, proximités, offsets)
  **/
  replaceWith(newReal, canon, saving = true){
    // X().setMaxLevel(9)
    X(2, '-> PMot#replaceWith', {mot:this, newReal:newReal, canon:canon, saving:saving})
    const canonChange = canon.id != this.icanon.id
    const hasProxs    = Boolean(this.hasProximites)
    const hasBiProx   = Boolean(this.hasDoubleProximites)

    if ( canonChange && hasProxs ) {
      this.proxP && Proximity.remove(this.proxP)
      this.proxN && Proximity.remove(this.proxN)
    }

    if ( canonChange ) {
      // console.log("Il y a changement de canon (on doit retirer de l'ancien canon)")
      this.icanon.remove(this) // étudie aussi les nouvelles proximités
    }

    if (canonChange) {
      this._icanon  = canon
      this._canon   = canon.canon
      this.icanon.insert(this) // étudie aussi les proximités
    }

    // Changer les valeurs propres au nouveau mot
    this._canon = canon.canon
    this._real  = newReal
    delete this._length

    this.motObj.innerHTML = newReal
    this.motObj.setAttribute('data-canon', this.canon)

    saving && this.save()

    // X().unsetMaxLevel()
  }

  observe(){
    if (this.span){
      this.span.addEventListener('click', this.onClick)
    }
  }

  unobserve(){
    if (this.span){
      this.span.removeEventListener('click', this.onClick)
    }
  }
  /**
    Met le mot en proximité avec ses autres mots

    [1]
      Le test sur 'this.span' est indispensable, car au moment où on
      fait l'opération, toutes les pages ne sont pas forcément affichées.
  **/
  proximitize(){
    // Placer les observateurs d'évènement
    // cf. [1] ci-dessus à propos du test du this.span
    if ( this.span ) {
      // Le mot peut déjà être observé, par exemple lorsqu'il était
      // en proximité avec un autre mot, mais que sa proximité a changé,
      // suite par exemple à la suppression d'un mot.
      this.isObserved && this.deproximitize()
      try {
        this.span.addEventListener('mouseover', this.onMouseOver)
        this.span.addEventListener('mouseout',  this.onMouseOut)
        this.isObserved = true
        // Définir la couleur de fond (en fonction du nombre de proximités)
        this.span.style.background = this.defineBackground()
      } catch (e) {
        App.onError(e)
        console.log(this)
        console.error("ERREURS AVEC PMot #%d ('%s')", this.id, this.real)
      }
    }
  }

  /**
    Retire la proximitisation du mot
  **/
  deproximitize(){
    // Retirer ses observateurs
    // cf. [1] ci-dessus à propos du test du this.span
    if ( this.span ) {
      this.span.removeEventListener('mouseover',  this.onMouseOver)
      this.span.removeEventListener('mouseout',   this.onMouseOut)
      // Retirer sa couleur de fond
      this.span.style.background = null
      // et ses classes
      this.span.classList.remove('prox')
      this.span.classList.remove('exergue') // certainement
    }
    this.isObserved = false
  }

  /*
    Data methods
  */

  /**
    Méthode enregistrant complètement le mot
    C'est-à-dire :
      - enregistre le fichier (PFile) du mot
      - enregistre les canons
      - enregistre les proximités
      - enregistre le fichier des offets et longueurs
  **/
  save(){
    this.saveFile() // sauve le mot
    this.ptexte.saveOffsets()
    PCanon.save()
    Proximity.save()
  }

  /**
    Prépare et renvoie les données pour l'enregistrement JSON dans les
    données de la page.
  **/
  get forJSON(){
    var hjson = {}
    for( var shortP in PMot.SHORTPROP2PROP ){
      Object.assign(hjson, {[shortP]: this[`_${PMot.SHORTPROP2PROP[shortP].prop}`]})
    }
    hjson.r || raise("Pas de real")
    // console.log("---- hjson = ", hjson)
    return hjson
  }

  /**
    Méthode qui prend les données telles qu'elles sont enregistrées dans
    le fichier et dispatche dans l'instance.
    Cf. forJSON ci-dessus pour voir les transformations
  **/
  fromJSON(data){
    for( var shortk in PMot.SHORTPROP2PROP ){
      this[`_${PMot.SHORTPROP2PROP[shortk].prop}`] = data[shortk]
    }
  }

  /*
  */

  /**
    Contenu de la ligne qui doit être affichée dans les rapports

    +Param+::
      +format+:: [String] Détermine les informations à afficher et dans quel
          ordre.
          On utilise des marqueurs `%{property}` pour indiquer les propriétés
          à prendre. Si la propriété doit avoir une longueur particulière, il
          suffit d'écrire `%{property.padEnd(12)}` (le format va être évalué
          après replacement de toutes les propriétés par this[property]) (pourquoi
          ne pas mettre ça directement, alors ?)
      +nospan+:: [Boolean] Si true, on renvoie la ligne telle quelle, sans span

    Exemple :
      format = `%{markRealOrId:20}`
        + ` #%{id:12} RO:%{relOffset:12} AO:%{absOffset:15}`
        + ` %{markProximizable:21} %{markProximites:20}`
  **/
  reportLine(format, nospan = false){
    const formated = PREFormate(format, this)
    if ( nospan ) return formated
    return `<span class="pre tiny">${formated}</span>`

  }

  /**
    Retourne la valeur de real si la mot est différent du canon, sinon 'id.'
  **/
  get markRealOrId(){
    return this.real == this.canon ? 'id.' : this.real
  }

  /**
    Retourne une marque pour le rapport, qui ressemblera à
      'out(canon ignoré)'
    et qu'on pourra utiliser dans le format de la méthode reportLine
    avec :
      `%{markProximizable:21}`
  **/
  get markProximizable(){
    const my = this
    if ( my.isProximizable ) { return 'in' }
    else {
      if ( my.canon.isProximizable ) { return 'out (mot ignoré)'}
      else { return 'out (canon ignoré)'}
    }
  }
  /**
    Retourne les marques pour les proximités pour la ligne de rapport
    utiliser dans format :
      %{markProximites:20}
  **/
  get markProximites(){
    const my = this
    var markProxP = '', markProxN = '';
    var len = 0 ; // pour calculer la longueur malgré les spans de red
    if ( my.isProximizable ) {
      if ( my.proxP ) {
        markProxP = `⇤ ${String(my.distanceP)}`
        len += markProxP.length
        markProxP = red(markProxP)
      }
      if (my.proxN){
        markProxN = `${String(my.distanceN)} ⇥`
        len += markProxN.length
        markProxN = red(markProxN)
      }
    } else {
      markProxP = markProxN = ''.padStart(10/* donc x 2*/)
    }
    return `${markProxP} ${markProxN}`
  }

  /*
    Volatile properties
  */

  /**
    Distance de proximité minimale pour que les deux mots ne soient
    pas en proximité.

    Pour pouvoir actualiser la distance minimale, il faudrait déterminer
    si elle a été définie avant qu'elle ait été changée dans la configuration.

    TODO Plus tard, cette valeur pourra être modifiée "à droite" et "à gauche"
    en fonction du fait que le mot appartient à une expression à proximité
    proche telle que "peu à peu", "de moins en moins", etc.
    Il y aura alors une distanceMinimale avant et après.
  **/
  get distanceMinimale(){ return this.icanon.distanceMinimale }
  get distanceMinimaleBefore(){
    return this.icanon.distanceMinimale
  }
  get distanceMinimaleAfter(){
    return this.icanon.distanceMinimale
  }

  /*
    State methods
  */

  /**
    +return+:: [Boolean] true si c'est un nouveau mot
    --------------------------------------
    Note : un mot est un nouveau mot jusqu'au moment où il est
    enregistré.
  **/
  get isNew(){ return this._isNew || false }
  set isNew(v){ this._isNew = v}

  /**
    Retourne TRUE si le mot est proximizable, c'est-à-dire que sa proximité
    peut-être étudée et mise en exergue.
    Par exemple, un mot en proximité peut ne pas être affiché si sa proximité
    a été supprimé ou ignorée.
  **/
  get isProximizable(){
    return this.icanon.isProximizable
      && !(this.state & STATE_IGNORE_PROXS)
  }

  /**
    Inverse de la précédente
  **/
  get notProximizable(){ return !this.isProximizable }

  /**
    Retourne TRUE si le mot est en proximité avec un autre
  **/
  get hasProximites(){
    return !!(this.proxP || this.proxN)
  }

  /**
    Retourne true si le mot est en double proximité, c'est-à-dire en
    proximité avec un mot avant et un mot après
  **/
  get hasDoubleProximites(){
    return !!(this.proxN && this.proxP)
  }


  /*
    Méthodes fonctionnelles
  */

  /**
    Méthode pour sauver le fichier de ce mot

    +Params+::
      +saveOffsets+:: [Boolean] SI true, le fichiers des offsets et des
          longueurs est sauvegardé lui aussi.
  **/
  saveFile(saveOffsets = false){
    this.paragraph.file.save(saveOffsets)
  }

  /**
    Méthode pour changer le statut d'un mot
  **/
  addState(sta){
    this.state = this.state | sta
    this.saveFile()
  }

  /**
    Méthode pour retirer un statut du mot
  **/
  removeState(sta){
    this.state | sta && (this.state -= sta)
    this.saveFile()
  }

  /*
    Méthodes évènementielles
  */

  onMouseOver(ev){
    if ( ! this.proxToolboxed ) {
      this.showInfosProx(ev)
      this.exergueProx()
    }
    return stopEvent(ev)
  }

  onMouseOut(ev){
    if ( ! this.proxToolboxed ) {
      this.hideInfosProx()
      this.unexergueProx()
    }
    return stopEvent(ev)
  }

  onClick(ev){
    this.showProxToolbox(ev)
  }

  /**
    Pour afficher la boite d'infos sur les proximités du mot
  **/
  showInfosProx(ev){
    this.infosProxBox || this.buildInfosBox()
    this.infosProxBox.show()
    // Positionnement au curseur
    this.infosProxBox.domObj.style.top = `${ev.clientY + 20}px`
    this.infosProxBox.domObj.style.left = `${ev.clientX + 10}px`
  }
  /**
    Pour cacher la boite d'info sur les proximités
  **/
  hideInfosProx(){
    this.infosProxBox && this.infosProxBox.hide()
  }

  /**
    Utilisation de la boite d'outils des proximités
  **/
  showProxToolbox(ev){
    ev && stopEvent(ev)
    this.hideInfosProx()
    this.proxToolboxed = true
    this.class.proxToolbox.attachTo(this, {meta:ev.metaKey, ctrl:ev.ctrlKey, alt:ev.altKey, maj:ev.shiftKey})
    return false
  }

  /**
    Construction de la boite d'infos des proximités
  **/
  buildInfosBox(){
    var spans = []
    // Si la distance minimale est différente de la valeur par défaut, on
    // signale cette distance.
    var mindist = ''
    if ( this.distanceMinimale != PMOT_DISTANCE_PROX_DEFAULT) {
      mindist = ` (min: ${this.distanceMinimale})`
    }
    const realA = this.proxP ? this.proxP.motA.real : null ;
    const realB = this.proxN ? this.proxN.motB.real : null ;
    this.proxP && spans.push(DCreate('DIV',{inner:`⇤ '${realA}' à ${this.proxP.distance}${mindist}`}))
    this.proxN && spans.push(DCreate('DIV',{inner:`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'${realB}' à ${this.proxN.distance}${mindist} ⇥`}))
    var boxDomId = `infobulle-mot-${this.id}`
    var css = ['infosbulle', 'noDisplay']
    if ( this.real == realA || this.real == realB ) css.push('hot')
    document.body.appendChild(DCreate('DIV',{id:boxDomId, class:css.join(' '), inner:spans}))
    this.infosProxBox = new UIObject(`#${boxDomId}`)
  }

  /**
    Mettre la proximité (les 2 ou 3 mots) en exergue
  **/
  exergueProx(){
    this.setExergueProx(true)
  }

  /**
    Défaire l'exergue mise sur les 2 ou 3 mots
  **/
  unexergueProx(){
    this.setExergueProx(false)
  }

  setExergueProx(exergue){
    try {
      var method = exergue ? 'add' : 'remove'
      this.span.classList[method]('exergue')
      this.proxP && this.proxP.motA.span.classList[method]('exergue')
      this.proxN && this.proxN.motB.span.classList[method]('exergue')
    } catch (e) {
      console.error(e)
      console.error("INFOS:\nMot #%d\n.px_idP: %d\n.px_idN: %d\nProxP et ProxN =", this.id, this.px_idP, this.px_idN, this.proxP, this.proxN)
    }
  }

  /*
    Calcul methods
  */

  /**
    Calcul l'offset absolu du mot
  **/
  calcAbsOffset(){
    return this.paragraph.absOffset + this.relOffset
  }

  /*
    Helpers
  */

  /**
    Les spans pour écrire le mot (et ce qui le suit) dans la page
  **/
  get asDom(){

    // Les objets DOM à construire
    var doms = []

    if (this.before)
    doms.push(DCreate('SPAN',{inner:this.before, class:'bef', 'data-id':this.id}))
    // Le mot proprement dit
    // Note : ce n'est pas ici qu'on règle la couleur de fond, c'est dans la
    // méthode `proximitize()`
    doms.push(DCreate('SPAN',{
        inner:this.real
      , 'data-id':this.id
      , 'data-canon': this.canon
      , class:this.css
    }))

    // Le texte entre les mots
    doms.push(DCreate('SPAN',{class:'tbw', 'data-id':this.id, inner:this.tbw}))

    return doms
  }

  /**
    Classe CSS du mot en fonction de sa proximité avec son autre mot
  **/
  get css(){
    var c = ['mot']
    this.hasProximites && c.push('prox')
    return c.join(' ')
  }

  /**
    Méthode appelée pour définir le background
    Trois types de fond sont possibles :
      - aucun fond (la méthode retourne undefined)
      - une seule proximité donc un seul fond
      - double proximité avant/après donc un dégradé
  **/
  defineBackground(){
    // this.log(`-> defineBackground (this.hasProximites = ${this.hasProximites}, this.hasDoubleProximites = ${this.hasDoubleProximites})`)
    if (this.hasDoubleProximites){
      // Utiliser un gradient pour le fond
      return `${this.defineGradientDoubleProximity()}`
    } else if ( this.hasProximites ) {
      // Utiliser une couleur correspondant à la distance
      var pctDist = this[this.proxP?'proxP':'proxN'].pourcentageDist;
      return `rgb(${this.backgroundColorPerDistance(pctDist)})`
    } else {
      return null
    }
  }
  /**
    Définir le gradient du fond, quand il y a double proximité
  **/
  defineGradientDoubleProximity(){
    var pctDistP = this.backgroundColorPerDistance(this.proxP.pourcentageDist)
    var pctDistN = this.backgroundColorPerDistance(this.proxN.pourcentageDist)
    return `linear-gradient(90deg, rgba(${pctDistP},1) 30%, rgba(${pctDistN},1) 100%)`
  }

  backgroundColorPerDistance(pdp){
    if      (pdp < 20 ) return '255, 201, 201'; //'255,0,0';
    else if (pdp < 45 ) return '255, 239, 193'; //'255,190,0';
    else if (pdp < 75)  return '196, 212, 249'; // '0,0,255';
    else                return '203, 253, 171'; //'36,199,119'
  }

  /**
    L'élément DOM principal (span), contenant :
      span.before
      span.mot
      span.tbw
  **/
  get obj(){
    return this._obj || (this._obj = DGet(`#mot-${this.id}`))
  }
  /**
    L'élément DOM (span) du span contenant le mot dans la page
  **/
  get motObj(){
    return this._motobj || ( this._motobj = this.obj && DGet(`.mot[data-id="${this.id}"]`, this.obj))
  }
  get span(){return this.motObj} // alias



  /*
    Volatile properties
  */

  /**
    Instance {PParagraph} à laquelle appartient le mot
    (alias de `parent`)
  **/
  get paragraph(){
    return this._paragraph || (this._paragraph = PParagraph.get(this.paragraphId))
  }

  /**
    Instance {PMot} du mot précédent
  **/
  get motP(){
    return this._motp || (this._motp = PMot.get(this.idP))
  }
  get prev(){return this.motP}
  /**
    Instance {PMot} du mot suivant
  **/
  get motN(){
    return this._motn || (this._motn = PMot.get(this.idN))
  }
  get next(){return this.motN}

  /**
    Instance {Canon} du mot
  **/
  get icanon(){
    return this._icanon || (this._icanon = PCanon.get(this.canon))
  }

  /**
    Proximité (instance {Proximity}) avec un mot avant (if any)
  **/
  get proxP(){
    return this._proxP || ( this._proxP = Proximity.get(this.px_idP) )
  }

  /**
    Proximité (instance {Proximity}) avec un mot après (if any)
  **/
  get proxN(){
    return this._proxN || ( this._proxN = Proximity.get(this.px_idN) )
  }

  /**
    Distance entre le mot et le mot avant si proximité
  **/
  get distanceP(){
    return this.proxP && this.proxP.distance
  }

  /**
    Distance entre le mot et le mot après si proximité
  **/
  get distanceN(){
    return this.proxN && this.proxN.distance
  }

  /**
    Pourcentage de distance avec le mot avant (if any)
  **/
  get pourcentageDistanceP(){
    return this.proxP && (this.distanceP / this.proxP.distance_minimale)
  }

  /**
    Pourcentage de distance avec le mot après (if any)
  **/
  get pourcentageDistanceN(){
    return this.proxN && (this.distanceN / this.proxN.distance_minimale)
  }

  /**
    Retourne la fréquence du mot
  **/
  get frequence(){
    return this.icanon.count
  }

  // Offset absolu (dans tout le texte)
  get offset()  {return this.absOffset}
  set offset(v) {this._absOffset = v}

  /**
    Alias de real
  **/
  get mot(){return this._real}


  /*
    Propriétés fixes
  */

  get id()          {return this._id}
  set id(v)         {this._id = v}
  // Le mot tel qu'il est dans le texte
  get real()        {return this._real}
  // Canon du mot
  get canon()       {
    if ( undefined === this._canon ) {
      if ( undefined === this.icanon ) {raise(`Il faut que canon ou icanon soit défini. Un mot a toujours un canon.`)}
      else { this._canon = this.icanon.canon }
    } return this._canon ;
  }
  set canon(v)      {this._canon = v}
  // 2tat du mot
  get state()       {return this._state || 0}
  set state(v)      {this._state = v}
  // Identifiant du mot après et avant
  get idN()         {return this._idN}
  set idN(v)        { this._idN = v ; delete this._motn}
  get idP()         {return this._idP}
  set idP(v)        {this._idP = v; delete this._motp}
  // Version minuscule du mot
  get downcase()    {return this._downcase}
  // Version du mot pour le classement
  get sortish()     {return this._sortish}
  // String entre ce mot et le mot suivant
  get tbw()         {return this._tbw || ''}
  // String avant le mot (par exemple une marche markdown)
  get before()      {return this._before}
  // Longueur du mot
  get length()      {return this._length || this.real.length}
  // Longueur totale que prend le mot dans la page
  get totalLength() {return this.length + (this.before||'').length + this.tbw.length}

  // ID du paragraphe
  get paragraphId()     {return this._paragraphId}

  // Identifiant de la proximité avant (if any)
  get px_idP() { return this._px_idP }
  set px_idP(v){ this._px_idP = v; delete this._proxP}
  // Identifiant de la proximité après (if any)
  get px_idN() { return this._px_idN }
  set px_idN(v){ this._px_idN = v; delete this._proxN}


}
