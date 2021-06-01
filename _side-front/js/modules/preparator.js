/** ---------------------------------------------------------------------
  *   Module preparator.js
  *   Prépare un texte pour Proximity

[OBSOLÈTE] "Préparer un texte" signifie transformer le texte en mots ({PMot}),
phrases ({PPhrase}) page ({PPage}) et cahier ({PCahier}) afin de
les gérer facilement dans l'application.

Maintenant, le texte est simplement décomposé en un certain nombre de fichiers,
pour ne pas être trop gros, comme un texte continu.

Le préparateur créer aussi un fichier des proximités.
*** --------------------------------------------------------------------- */

const Stream    = require('stream')

class Preparator {

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(ptexte){
    this.ptexte = ptexte

    /*
      Bingings
    */

    this.prepareThenOpen = this.prepareThenOpen.bind(this)
    this.prepare = this.prepare.bind(this)

  }

  log(msg){
    Log.write('[Preparator]', 'color:brown', msg)
  }

  /**
    = main =

    Prépare puis demande l'ouverture du texte

  **/
  async prepareThenOpen(){
    const my = this
    my.log('-> prepareThenOpen')
    UI.waiter("Préparation du texte. Merci de patienter…")
    await my.prepare()
      .then(my.treateEachParagraph.bind(my))
      .catch(err=> console.error(err))
    my.log('<- prepareThenOpen (mais pas la fin réelle)')
  }

  /**
    Méthode finale de la préparation
    Elle lance le chargement du texte analysé
  **/
  onEndPreparation(){
    // S'il n'y a pas eu d'erreur, on procède au chargement du texte
    console.log("-> Fin de la préparation du texte")
    this.ptexte.saveChecksum()
    UI.stopWaiter()
    PTexte.preparing = false
    PTexte.open(this.ptexte.path)
    temporizeAvant(this.masqueLiveReport.bind(this), 2)

  }

  /**
    Prepare le texte en l'analysant
    @async
  **/
  prepare(){
    // DEBUG(ON)
    const my = this
    my.log('-> prepare')
    return new Promise((ok,ko)=>{

      // On prépare l'interface pour cette prépation
      this.prepareUI()
      // On prépare le dossier qui va recevoir les pages
      this.preparePagesFolder()

      // Note : tous les reset sont mis dans PTexte.open ou .prepare

      const streamIN  = fs.createReadStream(this.ptexte.path)
      const streamOUT = new Stream()
      const RL = ReadLine.createInterface(streamIN,streamOUT)

      // L'analyseur qui servira à analyser chaque paragraphe.
      my.analysor = new TextAnalyze(this.ptexte)

      // Initialisation des valeurs
      my.lineCount      = 0
      my.currentOffset  = 0 // offset absolu courant
      my.wordsCount     = 0
      my.currentFileId  = null

      RL.on('line', my.createParagraphs.bind(my))
      RL.on('close', () => {
        console.log("--- FIN LECTURE FICHIER ---")
        ok()
      })
    })
    my.log('<- prepare (fin @async)')
  }

  preparePagesFolder(){
    // Il faut commencer par vider le dossier, s'il existe
    if ( fs.existsSync(this.ptexte.pagesFolder) ) {
      // fs.rmdirSync(this.ptexte.pagesFolder)
      execSync(`rm -rf "${this.ptexte.pagesFolder}"`)
    }
    fs.mkdirSync(this.ptexte.pagesFolder)
  }

  /**
    Traitement de chaque paragraphe (venant du stream)
  **/
  createParagraphs(paragStr){
    const my = this
    paragStr = paragStr.trim()
    if ( paragStr == '' ){
      console.log("Le %de paragraphe est vide, il n'est pas pris en compte.", my.lineCount)
      return
    }
    ++my.lineCount;
    // console.log(`--- Traitement de : “${paragStr}”`)
    this.createNewParagraph(paragStr)
    my.spanLinesTraited.innerHTML   = my.lineCount
    my.spanCurrentOffset.innerHTML  = my.currentOffset
    my.spanPagesTraited.innerHTML = Math.ceil(my.currentOffset / PAGE_DEFAULT_LENGTH)
    my.currentOffset += paragStr.length + 1 // +1 <= le retour chariot
  }

  /**
    Création du nouveau paragraphe (instance)

    Nouvelle formule : c'est tout de suite ici qu'on crée la nouvelle
    instance de page (PFile) si le paragraphe atteint la limite de page
    (en fait, maintenant, on part du principe que le prochain paragraphe aura
    une longueur déterminée, c'est plus simple)
  **/
  createNewParagraph(paragStr){
    const my = this
    const paragLen = paragStr.length + 1
    var newPageRequired = false ;
    if ( !my.currentPFile ) {
      newPageRequired = true
    } else if (my.currentPFileLength + paragLen + 100 > PAGE_DEFAULT_LENGTH) {
      newPageRequired = true
    }
    if ( newPageRequired ) {
      // TODO Mettre un compteur visuel de création de PFile
      my.currentPFile = this.createNewPFile({offset:my.currentOffset})
      my.currentPFileLength = 0
    }

    // Nouvelle instance de paragraphe
    var newParag = new PParagraph({
        ptexte:this.ptexte
      , originalText:paragStr
      , length:paragLen
      , absOffset:my.currentOffset
      , relOffset:(my.currentOffset - my.currentPFile.offset)
      , fileId: my.currentPFile.id
    })

    // console.log("Paragraphe #%d longueur:%d", newParag.id, paragLen)
    // Ajout du paragraphe à son fichier
    my.currentPFile.addParagraph(newParag)
    // Ajout de la longueur (pour suivre la longueur de la page et savoir
    // s'il faut passer à la suivante)
    my.currentPFileLength += paragLen
  }

  /**
    Création d'un PFile (pour le moment vide de paragraphe)
  **/
  createNewPFile(data){
    return new PFile(Object.assign(data,{ptexte:this.ptexte}))
  }

  treateEachParagraph(){
    this.log('-> treateEachParagraph')
    const my = this
    my.paragraphes = PParagraph.itemList
    temporize(my.prepareUIphaseAnalyseParagraphs.bind(my), 1000)
    .then(my.treateNextParagraph.bind(my))
    .catch(err => console.error(err))
    this.log('<- treateEachParagraph')
  }

  treateNextParagraph(){
    const parag = this.paragraphes.shift()
    if ( parag ) {
      if ( parag.originalText != '' ) {
        this.spanTraitedParagraphs.innerHTML = parag.id
        temporize(this.treateParagraph.bind(this,parag),5)
        .then(this.treateNextParagraph.bind(this))
      } else {
        // Pas de texte
        parag.mots = []
        this.treateNextParagraph()
      }
    } else {
      // Tous les paragraphes ont été traités
      this.afterParagraphsTreatment.call(this)
    }
  }

  treateParagraph(parag){
    parag.setMots(this.analysor.analyzeParagraph(parag, parag.originalText), this.lastPMot)
    if ( parag.mots.length ) {
      this.lastPMot = parag.mots[parag.mots.length - 1]
    }
    this.wordsCount += parag.mots.length
    this.spanNombreMots.innerHTML = this.wordsCount
    // console.log("mots = ", mots)
  }

  afterParagraphsTreatment(){
    const my = this
    console.log("Fin de l'analyse des paragraphes")
    temporize(my.prepareUIphaseSaveCanons.bind(my),1000)
    .then(my.saveCanonsInFiles.bind(my))
  }

  /**
    Enregistrement de tous les PFile
    + Fichier définissant les offsets et les longueurs
  **/
  savePFilesInFiles(){
    const my = this
    PFile.items.forEach(pfile => {
      my.spanSavedPages.innerHTML = pfile.id
      pfile.save()
    })
    this.ptexte.saveOffsets()
    this.afterFilesSave()
  }

  afterFilesSave(){
    const my = this
    console.log("Fin de l'enregistrement des fichiers")
    this.onEndPreparation()
  }

  saveCanonsInFiles(){
    // C'est inutile puisque les canons se refont au chargement des
    // mots. Mais on, j'essaie comme ça quand même, même si la fonction
    // ne fait rien. En fait, l'enregistrement pourrait devenir utile
    // si on en a besoin dans la modification des proximités, quand un
    // mot, par exemple, est remplacé par un autre. Mais normalement,
    // même dans ce cas, on aura pas besoin de l'enregistrement
    PCanon.save(this.ptexte)
    console.log("Fin de l'enregistrement des canons")
    const my = this
    console.log("Fin de l'analyse")
    temporize(my.prepareUIforCheckProximites.bind(my),1000)
    .then(my.checkProximites.bind(my))
  }

  checkProximites(){
    console.log("-> checkProximités")
    const my = this
    Proximity.reset()
    my.treateEachCanon()
    console.log("<- checkProximités")
  }

  treateEachCanon(){
    this.log('-> treateEachCanon')
    this.canons = PCanon.itemList
    SHOW_DETAILS_ANALYSE_PROXIMITES && X().setMaxLevel(9)
    this.treateNextCanon.call(this)
    this.log('<- treateEachCanon')
  }

  treateNextCanon(){
    const canon = this.canons.shift()
    if ( canon ) {
      this.spanTraitedCanons.innerHTML = canon.id
      temporize(canon.analyseProximities.bind(canon), 2)
      .then(this.treateNextCanon.bind(this))
    } else {
      SHOW_DETAILS_ANALYSE_PROXIMITES && X().unsetMaxLevel()
      this.afterCheckProximitesInCanons.call(this)
    }
  }

  afterCheckProximitesInCanons(){
    console.log('-> afterCheckProximitesInCanons')
    temporize(this.prepareUIforSaveProximites.bind(this),500)
    .then(this.saveProximites.bind(this))
    console.log('<- afterCheckProximitesInCanons')
  }

  saveProximites(){
    console.log('-> saveProximites')
    Proximity.save(this.ptexte)
    temporize(this.prepareUIforSavePTexteData.bind(this),1000)
    .then(this.savePTexteData.bind(this))
    console.log('<- saveProximites')
  }

  savePTexteData(){
    console.log('-> savePtexteData')
    this.ptexte.writePTexteData()
    const report = DGet('#live-report')
    this.spanProxFileCreated.innerHTML = 'OK'
    report.append(DCreate('DIV',{inner:'<br><br>=== Préparation exécutée avec succès ==='}))
    temporize(this.prepareUIphaseSaveFiles.bind(this),1000)
    .then(this.savePFilesInFiles.bind(this))
    console.log('<- savePtexteData')
  }


  /**
    Pour masquer le rapport de traitement
  **/
  masqueLiveReport(){
    const report = DGet('#live-report')
    report && report.remove()
  }

  log(str){return this.ptexte.log(str)}


  /**
    Construit le fichier prox_data.json
  **/
  buildProxDataFile(){
    IO.saveJSON(this.ptexte.proximitesPath, this.resultats.proximites.datas)
  }

  asLabelUI(label){
    return label.padEnd(30,'.') + ' '
  }
  prepareUI(){
    var div = DCreate('DIV', {
      id: 'live-report'
    , style: 'position:fixed;min-width:560px;background-color:black;color:white;padding:1em;margin:0;font-family:monospace;font-size:14.6pt;'
    , inner:[
        DCreate('DIV', {inner:'* Lecture du fichier *'})
      , DCreate('DIV', {inner:[
            DCreate('LABEL', {inner:this.asLabelUI('Lignes traitées')})
          , DCreate('SPAN', {id:'traited-lines', inner: '---'})
        ]})
      , DCreate('DIV', {inner:[
            DCreate('LABEL', {inner:this.asLabelUI('Décalage courant')})
          , DCreate('SPAN', {id:'current-offset', inner: '---'})
        ]})
      , DCreate('DIV', {inner:[
            DCreate('LABEL', {inner:this.asLabelUI('Pages traitées')})
          , DCreate('SPAN', {id:'traited-pages', inner: '---'})
        ]})
    ]})
    document.body.append(div)

    // Pour écrire le déroulé
    this.spanPagesTraited   = DGet('span#traited-pages')
    this.spanCurrentOffset  = DGet('span#current-offset')
    this.spanLinesTraited   = DGet('span#traited-lines')

  } // /prepareUI

  prepareUIphaseAnalyseParagraphs(){
    const report = DGet('#live-report')
    report.append(DCreate('DIV',{inner:"\n* Analyse des paragraphes *"}))
    report.append(DCreate('DIV', {inner:[
        DCreate('LABEL', {inner:this.asLabelUI('Paragraphes traités')})
      , DCreate('SPAN', {id:'traited-paragraphs', inner: '---'})
      , DCreate('SPAN', {inner: ` / ${this.lineCount}`})
    ]}))
    report.append(DCreate('DIV', {inner:[
        DCreate('LABEL', {inner:this.asLabelUI('Nombre mots')})
      , DCreate('SPAN', {id:'nombre-mots', inner: '---'})
    ]}))
    this.spanTraitedParagraphs = DGet('span#traited-paragraphs')
    this.spanNombreMots = DGet('span#nombre-mots')
  }

  prepareUIphaseSaveCanons(){
    const report = DGet('#live-report')
    report.append(DCreate('DIV',{inner:"\n* Enregistrement des canons *"}))
  }
  prepareUIphaseSaveFiles(){
    const report = DGet('#live-report')
    report.append(DCreate('DIV',{inner:[
          DCreate('DIV', {inner:"\n* Enregistrement des pages *"})
        , DCreate('LABEL', {inner:this.asLabelUI('Fichiers enregistrés')})
        , DCreate('SPAN', {id:'saved-page-index', inner: '---'})
      ]}))
    report.append(DCreate('DIV', {inner:[
        DCreate('LABEL', {inner:this.asLabelUI('Paragraphes traités')})
      , DCreate('SPAN', {id:'traited-paragraphs-2', inner: '---'})
      , DCreate('SPAN', {inner: ` / ${this.lineCount}`})
    ]}))
    this.spanTraitedParagraphs2 = DGet('span#traited-paragraphs-2')
    this.spanSavedPages = DGet('span#saved-page-index')
  }

  prepareUIforCheckProximites(){
    const report = DGet('#live-report')
    report.append(DCreate('DIV',{inner:"\n* Check des proximités *"}))
    report.append(DCreate('DIV', {inner:[
      DCreate('LABEL', {inner:this.asLabelUI('Canons traités')})
    , DCreate('SPAN', {id:'traited-canons', inner: '---'})
    , DCreate('SPAN', {inner: ` / ${PCanon.count}`})
    ]}))
    this.spanTraitedCanons = DGet('span#traited-canons')
  }

  prepareUIforSaveProximites(){
    const report = DGet('#live-report')
    report.append(DCreate('DIV',{inner:"\n* Enregistrement des proximités *"}))
    report.append(DCreate('DIV', {inner:[
      DCreate('LABEL', {inner:this.asLabelUI('Création du fichier')})
    , DCreate('SPAN', {id:'file-proximities-created', inner: '---'})
    ]}))
    this.spanProxFileCreated = DGet('span#file-proximities-created')
  }

  prepareUIforSavePTexteData(){
    const report = DGet('#live-report')
    report.append(DCreate('DIV',{inner:"\n* Enregistrement des data du texte *"}))
  }

}//PTexte

module.exports = Preparator
