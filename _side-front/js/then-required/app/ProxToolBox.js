'use strict';
/** ---------------------------------------------------------------------
  Objet ProxToolbox (classe)
  -----------------
  Boite pour gérer interactivement les proximités
  Elle permet de déterminer qu'il faut supprimer, ignorer, remplacer,
  etc. une proximité.

  Elle peut même fonctionner avec un mot sans proximité, mais dans ce cas,
  ne présente pas autant de menus.

  On se sert d'une seule instance, possédée par PMot.proxToolbox, qu'on
  déplace de mot en mot au gré des besoins. Elle apparait quand on clique sur
  un mot avec proximité (ou nom)
*** --------------------------------------------------------------------- */
class ProxToolBox {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  static get DATA_MENUS(){
    return this._datamenus || (this._datamenus = [
        {id:'menu-remplacer', text:loc('word.replace'), observer:'onReplace'}
      , {id:'menu-ignore', text:loc('app.word.ignore'), observer:'onIgnore'}
      , {id:'menu-unignore', text:loc('app.word.unignore'), observer:'onUnignore', class:'noDisplay'}
      , {id:'menu-ignore-two', text:`${loc('app.word.ignore')} les...`, observer:'onIgnoreTwo'}
      , {id:'menu-ignore-all', text:loc('app.locution.canon.ignore.all'), observer:'onIgnoreAll'}
      , {id:'menu-unignore-all', text:loc('app.locution.canon.unignore.all'), observer:'onUnignoreAll', class:'noDisplay'}
      , {id:'menu-supprimer', text:loc('app.locution.word.delete'), observer:'onSupprime'}
    ])
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(ptexte){
    this.build()
    this._ptexte = ptexte

    this.onReplace = this.onReplace.bind(this)
  }

  /**
    Pour attacher la boite à un mot en particulier
    L'attacher signifie qu'on la place dans son span pour qu'elle apparaisse
    à côté de lui.

    +keys+:: [Object]   Table contenant la valeur des modifiers pressés ou non:
                        :meta, :ctrl, :alt, :maj
  **/
  attachTo(mot, keys){
    // console.log("keys: ", keys)
    this.mot = mot
    this.mot.obj.append(this.obj)
    this.scrolling = window.scrollY ;
    // Si la touche meta est pressée, on affiche directement la boite
    // remplacer
    if (keys.meta) {
      return this.onReplace()
    } else if (keys.alt) {
      return this.onSupprime()
    } else {
      this.show()
      this.setMenus()
    }

  }

  show(){
    // console.log("-> show")
    this.reset(/*start*/true)
    this.obj.classList.remove('noDisplay')
    this.groupeMenus.activate()
  }

  hide(ev){
    // console.log("-> hide")
    ev && stopEvent(ev)
    this.reset(/*start*/false)
    this.obj.classList.add('noDisplay')
    this.mot.proxToolboxed = false
    this.groupeMenus.desactivate()

    return false
  }

  reset(whenStart = true){
    whenStart || this.groupeMenus.unobserve()
      // Note : l'observation se fait après avoir construit les menus
  }

  /**
    Règle les menus en fonction du mot courant
    Inaugurée notamment pour préciser s'il y avait un ou deux mots en
    proximité avec le mot courant
  **/
  setMenus(){
    var showOrHide ;

    const sufIgnore2 = (this.mot.proxN && this.mot.proxP)?'trois':'deux'
    const textIgnore2 = loc('app.locution.canon.ignore.les',{nombre:sufIgnore2})
    this.groupeMenus.get('menu-ignore-two').text = textIgnore2

    const ignoreMot    = (this.mot.state & STATE_IGNORE_PROXS) != 0
    const ignoreCanon  = (this.mot.icanon.state & STATE_IGNORE_ALL) != 0

    // Visibilité des menus en fonction du fait que le mot est en proximité
    // ou nom
    showOrHide = (this.mot.hasProximites && !(ignoreMot||ignoreCanon)) ? 'show' : 'hide' ;
    ['ignore','ignore-two','ignore-all'].forEach(key => {
      this.groupeMenus.get(`menu-${key}`)[showOrHide]()
    })

    // Si le canon est ignoré, on doit montrer le menu pour "désignorer"
    // ce canon.
    this.groupeMenus.get('menu-unignore-all')[ignoreCanon?'show':'hide']()

    // Si le mot a une proximité mais qu'elle est ignorée, on ajoute
    // le menu pour "désignorer" le mot
    this.groupeMenus.get('menu-unignore')[ignoreMot?'show':'hide']()

    // Si pour une raison ou pour une autre on ne veut plus que la boite
    // se ferme après un click, on décommente cette ligne
    // this.groupeMenus.options.closeOnClick = false

  }//setMenus



  /**
    L'instance du groupe de menus
  **/
  get groupeMenus(){
    return this._groupemenus || (
      this._groupemenus = new DMenuGroup(this, this.constructor.DATA_MENUS)
    )
  }
  /**
    Fabrication de la boite, au tout départ
  **/
  build(){
    var spans = [
      DCreate('DIV',{class:'menu-fermer', inner:[DCreate('SPAN',{inner:'×'})]})
    ]
    // On ajoute tous les span du groupe de menu
    spans.push(this.groupeMenus.build())
    // On ajoute l'aide en dessous
    spans.push(DCreate('DIV',{class:'tiny noIndent', inner:this.help}))

    document.body.append(DCreate('DIV', {
        id: this.domId
      , class: 'proxtoolbox noDisplay'
      , inner: spans
    }))
    this.observe()
  }

  observe(){
    DGet('.menu-fermer > span', this.obj)
      .addEventListener('click', this.hide.bind(this))

    // On observe tous les menus du groupe de menus
    this.groupeMenus.observe()
  }

  /*
    Méthodes d'évènement
  */

  /**
    Demande de remplacement d'un mmot
  **/
  onReplace(ev){
    ev && stopEvent(ev)
    prompt(loc('pmot.ask.replace.question', {mot: this.mot.real}), {
        title: loc('pmot.ask.replace.title')
      , defaultAnswer:  this.mot.real
      , returnMethod: this.onDefineReplace.bind(this)
      , mainClass: 'replace-mot-input-field'
    })
    return false // pas de comportement par défaut
  }

  /**
    Quand on demande à n'ignorer que ce mot, pas celui ou ceux avec lesquels
    il est en proximité.
  **/
  onIgnore(ev){
    PTexte.busy = true
    ev && stopEvent(ev)
    this.proceedIgnoreMot(this.mot)
    PTexte.busy = false
    return false
  }
  /**
    Quand on veut ignorer aussi les 1 ou 2 mot reliés (en proximité)
  **/
  onIgnoreTwo(ev){
    PTexte.busy = true
    ev && stopEvent(ev)
    // Il faut mettre de côté les mots, car ils vont bouger
    const motA = this.mot.proxP && this.mot.proxP.motA
    const motB = this.mot.proxN && this.mot.proxN.motB
    motA && this.proceedIgnoreMot(motA)
    motB && this.proceedIgnoreMot(motB)
    this.proceedIgnoreMot(this.mot)
    PTexte.busy = false
    return false
  }
  proceedIgnoreMot(mot){
    mot.addState(STATE_IGNORE_PROXS)
    mot.proxP && Proximity.remove(mot.proxP)
    mot.proxN && Proximity.remove(mot.proxN)
    Proximity.fixProximityAround(mot)
  }

  /**
    Reconsidérer le mot courant précédemment ignorer
  **/
  onUnignore(ev){
    ev && stopEvent(ev)
    this.proceedUnignoreMot(this.mot)
  }
  proceedUnignoreMot(mot){
    mot.removeState(STATE_IGNORE_PROXS)
    Proximity.fixProximityAround(mot)
  }
  onUnignoreAll(ev){
    ev && stopEvent(ev)
    this.mot.icanon.unignore()
  }


  // Quand on choisit le menu 'Ignorer tous' de la proximité
  onIgnoreAll(ev){
    ev && stopEvent(ev)
    this.mot.icanon.ignore()
    return false
  }

  // Pour supprimer le mot
  onSupprime(ev){
    ev && stopEvent(ev)
    PMot.remove(this.mot, true /* enable cancelisation */)
    return false ; // event
  }

  onDefineReplace(newMot){
    if (!newMot) return ; // renoncement
    const motsCount = newMot.split(' ').length
    if ( motsCount > 1 ) {
      // Traitement complexe avec plusieurs mots
      this.replaceWordOneBySeveral(newMot)
    } else {
      this.replaceWordOneByOne(newMot)
    }
  }

  /**
    Remplacement du mot courant +this.mot+ par un autre mot +newMot+

    NOTE
      Il faudrait plutôt que ce soit une méthode de PMot
  **/
  replaceWordOneByOne(newMot){
    Busy.start('proxtoolbox-replaceWordOneByOne')
    const canon = PCanon.getOrCreateForMot(newMot)
    // console.log("canon = ", canon)
    if ( ! canon.isNew ){
      var newProx ;
      // Quand c'est un canon existant, il faut regarder si l'insertion
      // du mot va poser problème
      if ( newProx = canon.whatIfNewItemAt(this.mot.offset) ) {
        const question = loc(
            'pmot.replace.confirm-when-new-prox'
          , {motProx:newProx.real, distance:newProx.offset - this.mot.offset})
        const choix = confirm(question, this.proceeReplacement.bind(this, newMot, canon))
        return choix
      }
    }

    // WARNING : NE PAS DÉPLACER SANS RÉFLÉCHIR !!!
    // Dans tous les autres cas (*), on procède au changement
    // (*)  a) si le canon n'existe pas encore,
    //      b) si aucune proximité ne va être créée à cause de ce nouveau mot.
    this.proceeReplacement(newMot, canon, true /* confirmed */)

    this.ptexte.updateOffsetFrom(newMot.prev, false /* interactive */, false /* check proximities */)

    Busy.stop('proxtoolbox-replaceWordOneByOne')
  }

  /**
    Remplacement du mot courant par plusieurs mots

    Cela consiste à :
      - Insérer les mots du +segment+ après le mot choisi (this.mot)
      - Supprimer le mot choisi (this.mot)

    +Params+::
      +segment+::[String] Une portion qui contient forcément plusieurs mots

  **/
  replaceWordOneBySeveral(segment){
    Busy.start('proxtoolbox-replaceWordOneBySeveral')
    PTexte.lockSave() // pour empêcher l'enregistrement
    const analyzor = new TextAnalyze(this.ptexte)
    const words = analyzor.withNlpJsToolsFrench(segment)
    const wordsCount = words.length
    const lastIndex = wordsCount - 1

    // Il faut garder le texte-entre-les-mots du mot courant pour l'ajouter
    // au dernier mot
    if ( words[lastIndex].tbw == '') {
      words[lastIndex].tbw = String(this.mot.tbw)
    }

    var afterMot = this.mot
    const instanceWords = words.map( dmot => {
      // console.log("afterMot, dmot = ", afterMot, dmot)
      afterMot = PMot.insertAfter(dmot, afterMot)
      return afterMot
    })

    const firstMot = instanceWords[0]
    const lastMot  = instanceWords[lastIndex]

    // On peut détruire définitivement this.mot
    PMot.remove(this.mot)

    // Tout recalculer à partir du premier mot
    // console.log("Premier mot traité (pour recalcul offsets)", firstMot)
    this.ptexte.updateOffsetFrom(firstMot.prev, false /* interactive */, false /* check proximities */)

    // Analyser les proximités
    Proximity.checkFromTo(firstMot, lastMot)

    // Tout enregistrer si les données sont valides
    this.ptexte.checkDataIntegrity()
    .then(()=>{
      PTexte.unlockSave()
      firstMot.saveFile(true/*saveOffsets*/) // sauve le mot et donc les mots suivants
      PCanon.save()
      Proximity.save()
      Busy.stop('proxtoolbox-replaceWordOneBySeveral')
    })
    .catch(err => {
      PTexte.unlockSave()
      Busy.stop('proxtoolbox-replaceWordOneBySeveral')
      error(loc('ptexte.error.save.unabled'))
    })
  }

  /**
    Procéède au remplacement du mot si +confirmed+ est true.

    +Params+::
      +newMot+::    [String]  Le nouveau mot, en version String
      +canon+::     [PCanon]  Le canon du mot, nouveau ou créé
      +confirmed+:: [Boolean] True quand on a confirmé le remplacement
  **/
  proceeReplacement(newMot, canon, confirmed){
    confirmed && this.mot.replaceWith(newMot, canon)
  }

  /*
    Propriétés DOM
  */
  get menuIgnoreTwo(){
    return this._menuignoretwo || (this._menuignoretwo = DGet('.menu-ignore-two',this.obj))
  }
  get domId(){
    return this._domid || (this._domid = `proxtoolbox-${Number(new Date())}`)
  }
  get obj(){
    return this._obj || (this._obj = DGet(`#${this.domId}`))
  }

  get ptexte(){
    return this._ptexte || (this._ptexte = PTexte.current)
  }

get help(){
  return `
<br>
<br>⌘ Clic = Remplacer.
<br>⌥ Clic = Supprimer.
  `
}
}
