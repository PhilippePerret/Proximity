'use strict'
/** ---------------------------------------------------------------------
  *   Classe PTexte
  *
  * Gestion d'un texte complet, d'une simple lettre à un roman entier

Un 'PTexte' peut avoir plus niveau de développement :
  - C'est un texte chargé pour la première fois dans Proximity. Il faut
    l'analyser avec la commande `analyse_texte.rb` côté serveur.
  - C'est un texte analysés (ptexte.isAnalyzed est true) mais il n'a pas
    encore été utilisé dans Proximity, c'est-à-dire que les proximités n'ont
    pas encore été modifiées. Pour lui, on se sert des fichiers de l'analyse
    pour le reconstruire et l'afficher.
  - C'est un texte analysés et utilisé dans Proximity (ptexte.isProximitized)
    c'est-à-dire que les proximités ont été modifiées (supprimées, corrigées,
    etc.) Dans ce cas, on se sert des fichiers produits par Proximity pour
    le charger et l'afficher.
*** --------------------------------------------------------------------- */
class PTexte extends PTextElement {

  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /**
    Couleur en console
  **/
  static get consoleColor(){return 'blue'}

  /**
    Pour verrouiller l'enregistrement, c'est-à-dire pour empêcher de
    sauvegarder. Usage : PTexte.lockSave / PTexte.unlockSave
    Penser à déverrouiller dans un catch d'erreur, si erreur il peut y
    avoir.
    Les méthodes de sauvegarde doivent tester 'PTexte.saveLocked ?'
  **/
  static lockSave(){ this._saveLocked = true}
  static unlockSave(){this._saveLocked = false}
  static get saveLocked(){return this._saveLocked || false}

  /**
    Méthode permettant de choisir un texte
  **/
  static chooseTexte(){
    let choix = IO.choose({
      message:'Texte au format Markdown de préférence :',
      file:true, extensions:['txt','text','md']
    })[0]
    if ( !choix ) return // aucun fichier choisi
    this.open(choix)
    Prefs.save()

  }

  /**
    Ouverture et mise en texte courant du texte de chemin d'accès +path+
  **/
  static open(path){
    this.resetAll()
    if ( fs.existsSync(path)) {
      this.current = new PTexte(path)
      if ( this.current.isPrepared ) {
        this.current.open()
      } else {
        this.current.prepare()
      }
    } else {
      console.warn("Le fichier '%s' est introuvable.", path)
      Prefs.set('path_texte', null)
    }
  }

  /**
    Essai de méthode pour les tests qui permet d'utiliser la formule :
      PTexte.open(...).then(...)
  **/
  static openAsync(path){
    console.log('-> openAsync')
    const LAPS = 1000
    const TIMEOUT = 60000
    var curtime = 0
    return new Promise((ok,ko)=>{
      this.open(path)
      this.loopTimer = setInterval(()=>{
        curtime += LAPS
        if ( curtime > TIMEOUT ) ko("Temps dépassé pour le chargement d'un texte.")
        else if ( this.checkIfCurrentReady() ) {
          clearInterval(this.loopTimer)
          delete this.loopTimer
          ok()
        }
      }, LAPS)
    })
  }
  /**
    Méthode qui vérifie si le texte courant est prêt (*)
    C'est-à-dire préparé et chargé
  **/
  static checkIfCurrentReady(){
    console.log({
        texte: this.current.path
      , name: this.current.name
      , isReady: this.current.isReady
      , isDisplayed: this.current.isDisplayed
    })
    // return this.current.isPrepared && this.current.isReady && this.current.isDisplayed
    return this.current.isReady && this.current.isDisplayed
  }

  /**
    Définit le titre de la fenêtre
  **/
  static setTitle(titre){
    window.document.querySelector('TITLE').innerHTML = titre
  }

  /**
    Réinitialisation complète
    (par exemple avant le chargement d'un nouveau texte)
  **/
  static resetAll(){
    // Si un chargement est en cours, il faut l'interrompre
    this.loading && this.abortLoading()
    // On purge les classes
    this.reset()
    PFile.reset()
    PParagraph.reset()
    PMot.reset()
    Proximity.reset()
    PCanon.reset()
    // On vide l'interface
    UI.containerLeftPage.innerHTML = ''
    UI.rightColumn.innerHTML = ''
    this.setTitle('Proximity')
  }

  /**
    Méthode qui permet d'annuler le loading du texte courant
  **/
  static abortLoading(){
    console.log('-> PTexte::abortLoading')
    this.preparing  = false
    this.loading    = false
    this.loadingLastPages = false
  }

  // // Utile aux tests, pour le moment
  // static get textIsReady() {
  //   // console.log("this.loading, this.preparing", this.loading, this.preparing)
  //   return this.loading === false && this.preparing === false
  // }
  //
  static onSetCurrent(ptexte){
    Prefs.save() // normalement, il y a juste à faire ça
    this.log(`PTexte.current mis à "${ptexte.path}"`, ptexte)
  }

  /**
    Pour forcer l'analyse du texte courant, c'est-à-dire tout
    ré-initialiser
  **/
  static forceAnalyseCurrent(){
    if ( this.current ) {
      const question = loc('ptexte.analyse.confirm-force')
      confirm(question, this.proceedForceAnalyse.bind(this))
    } else {
      error(loc('ptexte.alert.texte-required'))
    }
  }
  static proceedForceAnalyse(choix){
    if ( false === choix ) return // renoncement
    fs.unlinkSync(this.current.dataPath)
    this.open(this.current.path)
  }

  static displayRapport(ptexte){
    ptexte = ptexte || this.current
    new PReport(ptexte).show()
  }
  /**
    Pour régler les configurations propres au texte courant
  **/
  static toggleConfig(){
    this.current && this.current.config.toggle()
  }

  /**
    Grande méthode de check des données avant l'enregistrement
    Elle vise à éviter absolument les mauvaises données
  **/
  static checkDataIntegrity(){
    if (!this.current) return false ; // pas de texte courant
    const result = this.checker.checkDataIntegrity()
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */

  /**
    Instanciation d'un ptexte, toujours avec son path
  **/
  constructor(path){
    super({})
    this._initPath  = path
    this.isLoaded   = false

    /*
        bindings
     */
    this.open = this.open.bind(this)
    this.load = this.load.bind(this)
    this.abortLoading = this.abortLoading.bind(this)
    this.buildAndFeed = this.buildAndFeed.bind(this)
    this.showLastPageRead = this.showLastPageRead.bind(this)
    this.writePTexteData = this.writePTexteData.bind(this)
    this.readDataFiles = this.readDataFiles.bind(this)
    this.checkDataIntegrity = this.checkDataIntegrity.bind(this)
    this.onReady = this.onReady.bind(this)
    this.onDisplayed = this.onDisplayed.bind(this)
  }

  /**
    Retourne true si le texte a déjà été analysé. Dans ce cas, il
    possède un dossier prox, et les fichiers/dossiers minimum à
    l'intérieur.
  **/
  get isPrepared() {
    try {
      fs.existsSync(this.proxFolder) || raise('Dossier prox inexistant')
      fs.existsSync(this.dataPath)    || raise('Fichier de données inexistant')
      fs.existsSync(this.inProx('proximities.data')) || raise('Données proximités inexistant')
      fs.existsSync(this.inProx('files')) || raise('Dossier des fichiers/pages inexistant')
      fs.existsSync(this.inProx('files/page-1.json')) || raise('Premier fichier/page inexistant')
      fs.existsSync(this.inProx('text.checksum')) || raise('Fichier checksum inexistant')
      this.checksumIsGood() || raise('Le fichier texte semble avoir été modifié (checksums différents)')
      return true
    } catch (err) {
      console.warn(`${err}. La préparation complète est nécessaire.`)
      return false
    }
  }

  saveChecksum(){
    var ck = checksum(fs.readFileSync(this.path,'utf8'))
    fs.writeFileSync(this.inProx('text.checksum'), ck)
  }
  checksumIsGood(){
    var oldck = fs.readFileSync(this.inProx('text.checksum'),'utf8')
    var newck = checksum(fs.readFileSync(this.path,'utf8'))
    if ( oldck != newck ) {
      var msg = `Ancien checksum  : ${oldck}${RC}` +
                `Nouveau checksum : ${newck}`
      console.warn(msg)
    }
    return oldck == newck
  }
  /**
    Ouverture d'un texte (sans passer par l'analyse côté serveur)

    La nouvelle opération va consister à découper le texte original
    en caractères, et à analyser les caractères visibles à l'écran.

  **/
  open(){
    const my = this
    this.isReady = false      // quand chargé
    this.isDisplayed = false  // quand affiché complètement
    // DEBUG(ON)
    try {
      UI.waiter("Chargement du texte. Merci de patienter…")
      my.class.loading = true
      my.setTitle()
      my.load()
    } catch (e) {
      this.abortLoading(e)
    }
  }

  /**
    Abort du chargement, souvent pour invalidité de données
  **/
  abortLoading(e){
    const my = this
    App.onError(e)
    my.class.loading = false
    my.class.loadingLastPages = false
    UI.stopWaiter()
  }

  get class(){return this.constructor}

  /**
    Méthode qui checke la validité des données
    @async
  **/
  checkDataIntegrity(){
    // On charge toujours un checker pour le texte
    return new Promise((ok,ko) => {
      const result = this.checker.checkDataIntegrity()
      if ( result ) { // Une erreur irréparable a été trouvée
        ko(result)
      } else { // si des erreurs ont été trouvées, elles ont pu être corrigées
        ok()
      }
    })
  }


  /**
    Chargement des données depuis le fichier JSON text_data.json
  **/
  load(){
    const my = this
    this.log('-> load')
    this.readDataFiles()
    .then(()=>{
      this.buildAndFeed.call(this)
      UI.stopWaiter()
    })
    .then(this.checkDataIntegrity)
    .then(this.onReady)
    .catch(App.onError)
    this.log('<- load')
  }

  /**
    Méthode appelée quand le texte est prêt (mais peut-être pas encore
    complètement affiché)
  **/
  onReady(){
    this.isReady = true
    var msg
    if ( this.isDisplayed ) {
      msg = `=== LE TEXTE “${this.name}” EST PRÊT ET AFFICHÉ ===`
    } else {
      msg = `=== LE TEXTE “${this.name}” EST PRÊT (mais pas encore affiché) ===`
    }
    console.log(`%c${msg}`,'font-weight:bold;')
    App.onReady.call(App)
  }

  /**
   * Méthode appelée quand toutes les pages sont affichées
   */
  onDisplayed(){
    console.log(`%c= TEXTE “${this.name}” PRÊT ET AFFICHÉ =`,'font-weight:bold;color:green;')
    this.isDisplayed = true
  }



  /**
    Appelé pour tout sauver, les pages/files, les proximités, etc.
  **/
  saveAll(){
    if ( PTexte.saveLocked ) {
      console.warn('Sauvegarde verrouillée. Je ne sauve rien.')
      return
    }
    this.writePTexteData()  // données courantes du texte (hors configuration)
    PFile.save(this)        // écriture de toutes les pages
    this.saveOffsets()      // Les offsets et longueurs (fichier séparé)
    Proximity.save(this)
    PCanon.save(this)
    // console.log("PTexte.loading (à la fin de  saveAll) = ", PTexte.loading)
  }

  /**
    Sauvegarde de tous les offsets dans leur fichier propre
    Ce fichier conserve tous les offsets des pages (PFile) et des paragraphes
    (PParagraph)
    Note : la méthode est appelée systématiquement quand on sauve un PFile
  **/
  saveOffsets(){
    var dOffsets = []
    PFile.items.forEach(pfile => {
      const offsParag = pfile.paragraphs.map(parag => {return {id:parag.id, relOffset:parag.relOffset, length:parag.length}})
      dOffsets.push({id:pfile.id, offset:pfile.offset, scroll:pfile.scroll, paragraphs:offsParag})
    })
    IO.saveJSON(this.pathOffsetsData, dOffsets)
  }

  /**
    Chargement du fichier des offsets
    (s'il existe, car il n'existe pas pour les vieilles versions)
  **/
  loadOffsets(){
    if ( fs.existsSync(this.pathOffsetsData) ) {
      PTexte.loading || raise(LOADING_ABORTED)
      this.dispatchOffsets(IO.loadJSON(this.pathOffsetsData))
    }
  }
  dispatchOffsets(dataOffsets){
    dataOffsets.forEach(dfile => {
      const pfile = PFile.get(dfile.id)
      pfile._offset = dfile.offset
      dfile.paragraphs.forEach(dparag => {
        const parag = PParagraph.get(dparag.id)
        parag._relOffset = dparag.relOffset
        parag._length = dparag.length
      })
    })
  }

  /**
    Pour lancer le checker de l'analyse (du texte) depuis le menu
  **/
  check(){
    this.checker.checkAndDisplay()
  }

  /**
    Le checker de données
  **/
  get checker(){
    if (undefined === this.classChecker){
      this.classChecker = App.requireModule('checker')
    }
    if ( undefined === this._checker ) {
      this._checker = new (this.classChecker)(this)
    } return this._checker ;
  }

  prepare(){
    const my = this
    try {
      UI.waiter("Préparation du texte. Merci de patienter…")
      my.class.preparing = true
      this.log("* préparation du texte requise *")
      const preparator = new (App.requireModule('preparator'))(this)
      preparator.prepareThenOpen()
    } catch (err) {
      console.error("ERREUR AU COURS DE LA PRÉPARATION DU TEXTE")
      console.error(err)
    }
  }

  /*
    Helpers methods
  */

  /**
    Règle le titre de la fenêtre
  **/
  setTitle(){
    this.constructor.setTitle(this.affixe)
    window.document.querySelector('TITLE').innerHTML = this.affixe
  }

  /**
    Construction du texte (une fois que toutes les données ont été chargées)
  **/
  buildAndFeed(){
    PTexte.loading || raise(LOADING_ABORTED)
    this.log('-> buildAndFeed')
    try {
      temporize(UI.waiter.bind(UI,'Construction du texte. Merci de patienter…'),500)
      .then(this.buildPages.bind(this))
    } catch (err) {
      if ( err == LOADING_ABORTED ) {
        raise(LOADING_ABORTED)
      } else {
        console.error(err)
      }
    } finally {
      UI.stopWaiter()
      this.log('<- buildAndFeed')
    }
  }

  /**
    Construction des pages
    ----------------------
    On construit les 5 premières très vite, puis on le fait tous les
    x secondes pour laisser le temps à l'application d'afficher et de
    travailler.
  **/
  async buildPages(){
    const my = this
    const len = this.pages.size
    for (var i = 0; i < len ; ++i) {
      // Pour interrompre le chargement
      // console.log({
      //     i: i
      //   , 'PTexte.loading': PTexte.loading
      //   , 'PTexte.loadingLastPages' : PTexte.loadingLastPages
      // })
      i < 6 || PTexte.loading || PTexte.loadingLastPages || raise(LOADING_ABORTED)
      var page = this.pages.get(1+i)
      if ( i == 6 ) {
        PTexte.loadingLastPages = true
      }
      if ( i < 6 ) {
        page.build() // PFile.build()
      } else {
        flash(`Le texte est en cours de fabrication. Il reste ${len - i} pages à afficher`,{keep:false})
        await temporizeAvant(page && page.build.bind(page),500)// Toutes les x millisecondes
        this.onDisplayed()
      }
    }
    if ( len < 6 ) {
      this.onDisplayed()
    }
  }

  /*
    Méthodes utilitaires
  */

  /**
    Retourne la Map de tous les fichiers (aka 'pages')
  **/
  get pages(){return PFile.items}

  /**
    Pour pouvoir utiliser ptexte.canons au lieu de PCanon.itemList
  **/
  get canons(){return PCanon.itemList}

  /**
    Affiche la dernière page lue.
  **/
  showLastPageRead(){
    this.log('-> showLastPageRead')
    PPage.showPageByNumber(this.config.get('lastPageReadNumber') || 1)
    this.log('<- showLastPageRead (fin réelle)')
  }


  /**
    Recalcule les offsets depuis le mot +mot+
    -----------------------------------------

    Note : le recalcul consiste à :
      - actualiser les offsets des mots du *paragraphe* après le mot +mot+
      - actualiser les offsets des paragraphes après le paragraphe du mot
      - actualiser les offsets des pages/pfile après la page du mot

    +Params+::
      +mot+:: [PMot]  Le mot à partir duquel il faut rectifier les offsets
                      Si non fourni, on prend le premier mot du texte
      +interactive+:: [Boolean] Si true, on affiche les messages
  **/
  updateOffsetFrom(mot, interactive = false, updateProximites = false){
    mot = mot || this.firstMot
    // X().setMaxLevel(9)
    X(2, '-> PTexte#updateOffsetFrom', {"Depuis le mot": mot, texte: this.path})

    // Pour conserver la liste des mots traités, afin d'éviter toute
    // boucle infinie
    var traitedWords = new Map()

    // Les valeurs de départ
    const motInitId       = Number(mot.id)
    const firstMot        = PMot.get(motInitId)
    var currentAbsOffset  = Number(mot.offset);
    var currentRelOffset  = Number(mot.relOffset);
    const firstParagId    = mot.paragraphId
    const motPage         = mot.paragraph.page
    X(7,'Valeurs de départ',{[`${mot} #${mot.id}`]:mot, 'Offset absolu du mot':currentAbsOffset, 'Offset relatif du mot':currentRelOffset, 'ID Paragraphe':firstParagId, 'Page':motPage})

    var uneDifferenceTrouved = false

    // On boucle tant qu'on ne change pas de paragraphe
    while(mot.next && mot.next.paragraphId == firstParagId){
      if ( traitedWords.has(mot.id) ) {
        raise(loc('ptexte.update-offsets.error.word-already-traited',{id:mot.id, real:mot.real}))
      } else {
        traitedWords.set(mot.id, mot)
      }
      const oldoffset = Number(mot.next._relOffset)
      mot.next._relOffset = Number(mot._relOffset + mot.totalLength)
      currentRelOffset = Number(mot.next._relOffset)
      currentAbsOffset += mot.totalLength
      X(9,'Étude du mot suivant',{[`Mot suivant #${mot.next.id}`]:mot.next, 'Son Offset rel. avant':oldoffset, 'Son nouvel offset':mot.next._relOffset, 'Offset absolu courant':currentAbsOffset})

      // if ( mot.next.id == 4) {
      //   TConsole.raw("\n\n\n==== BREAK ====\n\n")
      //   TConsole.raw("PMot.items au break = ", PMot.items)
      //   raise()
      // }

      if (currentRelOffset != oldoffset ) {
        X(9, 'Une différence d’offset a été détectée')
        uneDifferenceTrouved = true
      }
      mot = mot.next
    }

    // Si aucune différence d'offset n'a été détectée, on peut s'arrêter
    // là
    if ( false === uneDifferenceTrouved ) {
      // notice(loc('ptexte.message.offset.no-offset-rectified'))
      interactive && message(loc('ptexte.message.offset.no-offset-rectified.long'))
      flash(loc('ptexte.message.offset.no-offset-rectified.flash'))
      return
    }

    // Il faut ajouter la longueur du dernier mot du paragraphe
    currentAbsOffset += mot.totalLength
    X(9,'Ajout de la longueur du dernier mot du paragraphe', {currentAbsOffset:currentAbsOffset})

    X(7,'Actualisation des offsets des paragraphs suivants')
    // Paragraphe de départ
    var parag = PParagraph.get(firstParagId)
    X(8, 'Premier paragraphe (celui du premier mot)',{parag:parag})


    // Il faut ajouter 1 pour le retour chariot
    currentAbsOffset += 1

    // S'il y a un paragraphe suivant, il faut traiter les paragraphes
    // et les éventuelles pages suivantes. Sinon, on peut procéder à la
    // suite, la sauvegarde des éléments
    if ( parag.next ) {

      // On regarde s'il y a une différence d'offset
      // Note : peut être négatif
      const diffTotale = currentAbsOffset - parag.next.absOffset
      console.log("différence au niveau des paragraphes : ", diffTotale)

      if ( diffTotale != 0 ) {

        // Pour empêcher les boucles infinies
        var idpar = `parag-${parag.id}`
        if ( traitedWords.has(idpar) ) {
          raise(loc('ptexte.update-offsets.error.paragraph-already-traited',{id:parag.id}))
        } else {
          traitedWords.set(idpar, parag)
        }
        // S'il existe un paragraphe suivant, il faut vérifier que son offset
        // corresponde au nouveau calculé
        // On calcule surtout la différence qu'on va reporter sur tous les
        // éléments suivants.
        X(7, 'Différence d’offset (diffTotale) à reporter', {diffTotale:diffTotale, 'Offset absolu du paragraphe suivant':parag.next.absOffset, 'Offset absolu courant':currentAbsOffset})

        X(7, 'Boucle sur tous les paragraphes restants (de la page du mot)')
        var currentPageId = mot.paragraph.page.id

        // On boucle tant que c'est un paragraphe de la page du mot
        while(parag.next && parag.next.fileId == currentPageId){
          // console.log("parag.next", parag.next)
          // console.log("parag.next._relOffset = ", parag.next._relOffset)
          const oldOffset = Number(parag.next._relOffset)
          parag.next.relOffset += diffTotale
          console.log("[Paragraphe #%d] Ancien offet:%d, et nouvel offset:%d du paragraphe %d ", parag.next.id, oldOffset, parag.next.relOffset, parag.next.id)
          X(9,'Étude du paragraphe suivant',{'Paragraphe':parag.next, 'Offset relatif avant':oldOffset, 'Nouvel offset relatif':parag.next._relOffset})
          parag = parag.next
        }

        // S'il y a une page suivante, on doit poursuivre la correction
        X(7, 'Boucle sur tous les pages restantes (suivant la page du mot)')
        if ( motPage.next ) {
          // console.log("motPage.next", motPage.next)
          var page = mot.paragraph.page
          while(page.next){
            // console.log("Étude de la page (page.next)", page.next)
            // Pour empêcher les boucles infinies
            var idpage = `page-${page.id}`
            if ( traitedWords.has(idpage) ) {
              raise(loc('ptexte.update-offsets.error.page-already-traited',{num:page.id}))
            } else {
              traitedWords.set(idpage, page)
            }
            const oldOffset = Number(page.next.offset)
            page.next.offset += diffTotale
            // console.log("--> offset avant:%d / après:%d", oldOffset, page.next.offset)
            X(9,'Étude de la page suivante',{'Page':page.next, 'Offset absolu avant':oldOffset, 'Nouvel offset absolu':page.next.offset})
            page = page.next
          }
        } else {
          X(7, 'Le mot se trouve sur la dernière page : pas de page après à étudier')
        }
      } else {
        X(7, 'Le paragraphe du mot n’a pas de paragraphe suivant')
      }

    } // s'il y a une différence à traiter (diffTotale)

    // Les corrections ont été faites, on peut procéder à l'enregistrement
    // des pages. De la première modifiée (celle du mot) à la dernière,
    // toujours
    if ( PTexte.saveLocked ) {
      X(7, 'L’enregistrement est verrouillé, je ne sauvegarde pas les pages modifiées.', {depuis:motPage.id, 'Jusqu’à':PFile.count})
    } else {
      X(7, 'Sauvegarde de toutes les pages modifiées', {depuis:motPage.id, 'Jusqu’à':PFile.count})
      for ( var ipage = motPage.id; ipage <= PFile.count; ++ipage){
        var page = PFile.get(ipage)
        if ( page.save() ) {
          X(9,`Page #${ipage} sauvegardée avec succès`)
        }
      }
    }

    // Il faut réinitialiser tous les mots pour qu'ils tiennent compte
    // des nouvelles données
    X(7, 'Reset de tous les mots (pour forcer les recalculs)')
    mot = PMot.get(motInitId)
    mot.reset()
    while(mot = mot.next) mot.reset() ;

    if ( updateProximites ) {
      X(7, 'Relance du calcul des proximités demandé')
      Proximity.updateAllFrom(this, firstMot,interactive)
    }

    // X().unsetMaxLevel()
  }

  /*
    Word methods
  */

  /**
    Retourne le premier mot du texte (ou undefined)
  **/
  get firstMot(){
    return this._firstmot || (this._firstmot = this.pagesList[0].paragraphs[0].mots[0])
  }

  /*
    Page methods
  */

  /**
    Retourne les pages comme une liste [Array] de [PFile]
  **/
  get pagesList(){
    return Array.from(PFile.items.values())
  }

  /*
    Files & folders methods
  */

  /**
    Écriture de toutes les données (texte, , pages)
  **/
  async writePTexteData(){
    this.log('-> writePTexteData')
    IO.saveJSON(this.dataPath, this.forJSON)
    this.log('<- writePTexteData')
  }

  /**
    Lecture des données dans le dossier (à l'ouverture de l'application ou
    d'un texte)
  **/
  readDataFiles(){
    const my = this
    this.log('-> readDataFiles')
    return new Promise((ok,ko)=>{
      this.fromJSON(IO.loadJSON(this.dataPath))
      // Les données des canons (if any)
      PCanon.load(this)
      .then(Proximity.load.bind(Proximity, this))
      .then(()=>{
        PFile.load.call(PFile,this)
        // Les offsets et longueurs, dans leur fichier
        my.loadOffsets()
        ok()
      })
      .catch((err) => {
        console.error("UNE ERREUR EST SURVENUE : ", err)
        ko(err)
      })
      this.log('<- readDataFiles')
    })
  }

  /*
    Items methods
  */

  /*
    Méthodes de mot
  */

  /*
    States
  **/

  /*
    Data methods
  */

  /**
    Retourne les données pour le fichier text_data.json
    Surclasse la méthode super
  **/
  get forJSON(){
    return {
        appName:    app.getName()
      , appVersion: app.getVersion()
      , textPath:   this.path
      , createdAt:  this.createdAt || new Date()
      , savedAt:    new Date()
    }
  }

  fromJSON(data){
    for(var p in data){this[p] = data[p]}
  }

  /**
    Instance {TextAnalyze} du texte

    Gère tous les fichiers résultants de l'analyse du texte par analyse_texte.rb
  **/
  get analyze(){
    return this._analyze || (this._analyze = new TextAnalyze(this))
  }

  /*
    Properties
  */

  get config(){
    return this._config || (this._config = new PConfig(this) )
  }

  /**
    Méthode appelée après que l'on a modifié les valeurs de configuration
  **/
  onChangeConfig(changedConfigs) {
    // console.log("-> onChangeConfig(changement =)", changedConfigs)
    // Si la distance minimale a été changée, il faut réinitialiser toutes
    // les distances minimales des canons et recalculer les proximités des
    // deux pages affichées.
    if ( changedConfigs.distanceMinimale ){
      PCanon.updateAllDistancesMinimales(changedConfigs.distanceMinimale)
    }

    /**
      Si une au moins des valeurs qui influent sur le calcul des proximités
      a été modifiée, il faut tout recalculer.
    **/
    if ( changedConfigs.indiceFrequence || changedConfigs.distanceMinimale) {
      this.recalculeAll()
    }
  }

  /**
    Procède au recalcule complet des proximités
  **/
  recalculeAll(){
    var calculator = new (App.requireModule('recalcule_all'))(this)
    calculator.exec()
  }

  get pageCount(){
    return this._pagecount || (this._pagecount = this.calcPageCount())
  }
  calcPageCount(){
    // console.log("Longueur du texte : %d, longueur page: %d, rapport : %d", this.textLength, this.pageLength, Math.ceil(this.textLength / this.pageLength))
    return Math.ceil(this.textLength / this.pageLength)
  }

  get textLength(){
    return this._textlength || (this._textlength = fs.readFileSync(this.path).length )
  }

  /**
    Longueur de page définie ou par défaut
  **/
  get pageLength(){
    return this._pagelength || (this._pagelength = this.config.get('pageLength'))
  }

  /*
      files & folders
  */

  /**
    Fichier contenant tous les offsets (pages et paragraphes)
  **/
  get pathOffsetsData(){
    return this._pathoffsdata || (this._pathoffsdata = this.inProx('offsets.json'))
  }

  /**
    Retourne le chemin d'accès absolu, dans le dossier proximité, du
    chemin relatif +relpath+
  **/
  inProx(relpath){
    return path.join(this.proxFolder,relpath)
  }

  /**
    Dossier 'pages'
  **/
  get pagesFolder(){
    if ( undefined === this._pagesfolder ) {
      this._pagesfolder = this.inProx('files')
      fs.existsSync(this._pagesfolder) || fs.mkdirSync(this._pagesfolder)
    }
    return this._pagesfolder
  }

  // Le path du dossier contenant tous les éléments
  get proxFolder(){
    if ( undefined === this._proxfolder) {
      this._proxfolder = path.join(this.initFolder,`${this.affixe}_prox`)
      fs.existsSync(this._proxfolder) || fs.mkdirSync(this._proxfolder)
    } return this._proxfolder ;
  }

  /**
    Affixe du fichier
  **/
  get affixe(){
    return this._affixe || ( this._affixe = path.basename(this.initPath,path.extname(this.initPath)))
  }
  get name(){ return this.affixe }

  /**
    Dossier général, contenant le texte initial (et donc le dossier proximité)
  **/
  get initFolder(){
    return this._initfolder || (this._initfolder = path.dirname(this.initPath))
  }

  /**
    Chemin d'accès au fichier des données du texte
  **/
  get dataPath(){
    return this._datapath || (this._datapath = this.inProx('data_texte.json'))
  }

  /**
    Chemin d'accès au fichier de configuration
  **/
  get configPath(){
    return this._configpath || ( this._configpath = this.inProx('config.json') )
  }

  /**
    Chemin d'accès au fichier initial
  **/
  get initPath(){
    return this._initPath
  }
  get path(){
    return this.initPath
  }

}
