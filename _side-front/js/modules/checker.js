'use strict';
/** ---------------------------------------------------------------------
  *   Class Checker
  *


Toujours dans l'idée de travailler avec des fichiers absolument valides,
ce checker permet de checker en direct le fichier chargé
*** --------------------------------------------------------------------- */
const CheckerError = require('./checker/CheckerError.js')
const DATA_OPERATIONS_CHECKER = require('./checker/data_errors.js')

class DATAChecker {

  constructor(ptexte){
    this.ptexte = ptexte
  }


  /** ---------------------------------------------------------------------
    *
    *   PARTIE 1.1 --- CŒURS DE TESTS
    *
    * Cette première partie contient les méthodes qui checkent véritablement
    * les données et retournent les erreurs rencontrées.
    *
    * Note 1
    *   Toutes ces méthodes doivent se terminer par un this.addSuccess qui
    *   pose un message de succès en console.
    *
  *** --------------------------------------------------------------------- */

  /**
    Retourne true si le texte contient le bon nombre de mots. On compare
    la suite des mot.next et le nombre de mots enregistrés dans chaque
    paragraphe.

    Ces erreurs ne sont pas corrigeables, elles sont fatales.
  **/
  checkWordsCount(){
    X(1, '-> Checker#checkWordsCount')
    const withNext    = this.motsCountPerNext()
    const withParags  = this.motsCountInParagraphs()
    const inClass     = this.motsCountInClass()
    try {
      withNext == withParags  || raise({n:200, p:{next:withNext, parags:withParags}})
      withNext == inClass     || raise({n:201, p:{next:withNext, class:inClass}})
      this.addSuccess('Nombre de mots correct')
    } catch (e) {
      this.addFailure(e)
    }
  }

  /**
    Méthode qui checke les offsets des pages, des paragraphes et des mots
    pour vérifier qu'ils sont correctement définis.

    Les erreurs sont corrigeables, dans une certaine mesure.
  **/
  checkOffsetsFileAndParagraphs(){
    X(1, '-> Checker#checkOffsetsFileAndParagraphs')
    this.errorsCounter = 0
    const format = "PARAGRAPH #%{id:5} %{relOffset:6} %{absOffset:10} %{debut}"
    PFile.items.forEach(pfile => {
      this.verbose && this.write(1, `FICHIER #${pfile.id} Offset absolu : ${pfile.offset}`)
      this.verbose && this.write(2, this.headerChkOffsetsParagsFile)
      pfile.paragraphs.forEach(parag => {
        this.verbose && this.write(2, PREFormate(format, parag))
        this.checkOffsetAndLengthParagraph(parag, pfile)
      })
    })
    if ( this.errorsCounter > 0 ) {
      this.addFailure('Des erreurs d’offset ou de longueur de paragraphe')
    } else {
      this.addSuccess('Offsets et longueurs des PFile(s) et paragraphes corrects')
    }
  }


  /** ---------------------------------------------------------------------
    *
    *   PARTIE 1.2 --- SOUS MÉTHODES DE CŒUR DE TESTS
    *
    * Cette partie contient les sous-méthodes utiles aux méthodes qui checkent
    * véritablement les données.
    *
  *** --------------------------------------------------------------------- */

  /*
    Méthodes de check de mots
  */

  /**
    Retourne le nombre de mots obtenus en passant en revue les mots par
    leur propriété 'next'
    +return+::[Number] Nombre de mots
  **/
  motsCountPerNext() {
    var nb = 1 // Le premier
    var mot = this.ptexte.firstMot
    while((mot = mot.next)) ++ nb ;
    return nb
  }

  /**
    Retourne le nombre de mots obtenus en les comptant dans chaque
    paragraphe.
    +return+::[Number] Nombre de mots
  **/
  motsCountInParagraphs(){
    var nb = 0
    PFile.items.forEach(pfile => {
      pfile.paragraphs.forEach(parag => { nb += parag.mots.length })
    })
    return nb
  }

  /**
    Retourne le nombre de mots consignés dans la class PMot
    +return+::[Number] Nombre de mots
  **/
  motsCountInClass(){
    return Object.keys(PMot.items).length
  }

  /*
    Méthodes de check de paragraphes
  */

  /**
    Check du paragraph +parag+ [PParagraph] dans le fichier +pfile+ [PFile]
  **/
  checkOffsetAndLengthParagraph(parag, pfile){
    try {
      const isFirstParag = pfile.paragraphs[0].id == parag.id

      parag.fileId == pfile.id || raise({n:101, p:{par:parag.fileId, fic:pfile.id}})
      isFirstParag && parag.relOffset !== 0 && raise({n:102, p:{offset:parag.relOffset}})
      parag.absOffset == (parag.relOffset + pfile.offset) || raise({n:103, p:{exp:parag.relOffset+pfile.offset, par:parag.absOffset, fic:pfile.offset, rel:parag.relOffset}})
      const longueurFromMots = this.sumLengthMots(parag)
      // Pour la longueur, on donne une chance à un recalcul
      parag.length == (longueurFromMots + 1) || parag.reset()
      parag.length == (longueurFromMots + 1) || raise({n:104, p:{par:parag.length, exp:longueurFromMots+1}})
    } catch (e) {
      this.addFailure(e)
    }
  }

  /**
    Check de la proximity [Proximity] +prox+
  **/
  checkProximity(prox) {
    try {
      // Le motA et motB de chaque proximité doit être définie et
      // être un mot existant
      prox._motA_id || raise({n:300})
      prox._motB_id || raise({n:301})
      const motA = prox.motA
      const motB = prox.motB
      motA instanceof(PMot) || raise({n:302, p:{type:typeof(motA), class:(motA && motA.constructor && motA.constructor.name)}})
      motB instanceof(PMot) || raise({n:303, p:{type:typeof(motB), class:(motB && motB.constructor && motB.constructor.name)}})
      const canon = motA.icanon
      motA.canon == motB.canon || raise({n:304, p:{canonA:motA.canon, canonB:motB.canon}})
      canon.indexOf(motA) != -1 || raise({n:305, p:{id:motA.id, real:motA.real, canon:canon.canon, canonId:canon.id}})
      canon.indexOf(motB) != -1 || raise({n:306, p:{id:motB.id, real:motB.real, canon:canon.canon, canonId:canon.id}})
      canon.isProximizable || raise({n:307, p:{canon:canon.canon, canonId:canon.id}})
      motA.isProximizable || raise({n:308, p:{id:motA.id}})
      motB.isProximizable || raise({n:309, p:{id:motB.id}})
      // À bonne distance
      const distAB = motB.absOffset - motA.absOffset
      const distMin = Math.min(motA.distanceMinimaleAfter, motB.distanceMinimaleBefore)
      distAB <= distMin || raise({n:310, p:{dist:distAB, distM:distMin}})
      // Note : on pourrait vérifier que le motA et le motB soient bien
      // réglés, mais c'est déjà fait dans PMot. On le refait quand même,
      // parce qu'il semble y avoir des problèmes…
      motA._px_idN = prox.id || raise({n:311, p:{exp:prox.id, id:motA._px_idN, motA:motA}})
      motB._px_idP = prox.id || raise({n:312, p:{exp:prox.id, id:motB._px_idN, motB:motB}})
    } catch (e) {
      this.addFailure(Object.assign(e, {sujet:prox}))
    }
  }

  /** ---------------------------------------------------------------------
    *
    *   PARTIE 1.3 --- MÉTHODES DE CŒUR FONCTIONNELLES
    *
    * Cette partie contient les toutes petites méthodes fonctionnelle
    *
  *** --------------------------------------------------------------------- */

  /**
    +Params+::
      +parag+:: [PParagraph] Paragraphe dont il faut renvoyer la longueur

    +return+ [Number] Longueur obtenue en additionnant la longueur de tous les
        mots du paragraphe +parag+
  **/
  sumLengthMots(parag){
    var len = 0
    parag.mots.forEach(mot => len += mot.totalLength)
    return len ;
  }

  /** ---------------------------------------------------------------------
    *
    *   PARTIE 2.1 --- MÉTHODES FONCTIONNELLES D'INSTANCE (HELPERS)
    *
  *** --------------------------------------------------------------------- */

  /**
    Pour ajouter un succès dans le check. Un simple message à afficher en
    console si le mode verbose est défini.
  **/
  addSuccess(msg){
    console.log('%cDATA INTEGRITY: '+msg, 'color:green;')
  }
  /**
    Ajoute une failure (échec) Attention, ici, c'est l'erreur qui
    est envoyée, pas un simple message. La méthode
    Mais la méthode peut quand même recevoir un message string à afficher,
    sans produire d'erreur

    La méthode entretient aussi une propriété this.errorsCounter qui permet
    de connaitre le nombre d'erreurs locales (il suffit de mettre cette
    propriété à zéro au début d'une méthode). Noter qu'elle ne donne donc pas
    le nombre total d'erreurs. Ce total peut s'obtenir par la classe
    CheckerError.
  **/
  addFailure(err){
    var msg ;
    if ( typeof(err) == 'string') { msg = err }
    else {
      const newError = new CheckerError(this, err)
      msg = newError.failureMessage
      this.errorsCounter || ( this.errorsCounter = 0)
      this.totalErrorsCount || ( this.totalErrorsCount = 0 )
      ++this.totalErrorsCount
      ++this.errorsCounter
    }
    console.log('%cDATA INTEGRITY: %c'+msg, 'color:green;', 'color:red;')
  }
  /**
    Pour écrire un message "neutre" (c'est-à-dire ni un succès ni un échec,
    mais plutôt un message d'opération)
  **/
  addMessage(msg){
    console.log('%cDATA INTEGRITY: %c'+msg, 'color:green;', 'color:blue;')
  }

  // Entête pour le check des offsets et longueurs des paragraphes et fichiers
  get headerChkOffsetsParagsFile(){
    if ( undefined === this._headerChkOffsetsParagsFile) {
      const dHeader = [['ID',5], ['Rel.',6], ['Abs.Off',10]]
      let header = ['Paragraph']
      for(var paire of dHeader){ header.push(paire[0].padEnd(paire[1]))}
      header.push('Début du texte')
      this._headerChkOffsetsParagsFile = header.join(' ')
    }
    return this._headerChkOffsetsParagsFile
  }
  /** ---------------------------------------------------------------------
    *
    *   PARTIE 1.3 --- MÉTHODES PUBLIQUES
    *
    * Cette partie contient les méthodes qu'on appelle de l'extérieur pour
    * demandander les tests, afficher le checker, etc.
    *
  *** --------------------------------------------------------------------- */

  /**
    @public
    Méthode publique appelée au chargement et à l'enregistrement des données
    pour vérifier l'intégrité des données.
  **/
  checkDataIntegrity(){
    X(2, '-> Checker#checkDataIntegrity')
    CheckerError.reset()
    // Vérifier que le nombre de mots par 'next', dans les paragraphes et
    // dans la classe PMot soient bien égaux.
    this.checkWordsCount()
    // Vérifier les offsets des paragraphes et des fichiers, et leur
    // longueur
    this.checkOffsetsFileAndParagraphs()
    // Vérifier toutes les proximités
    this.checkProximities()

    // console.log("PTexte.loading (dans checkDataIntegrity) = ", PTexte.loading)
    X(2, '<- Checker#checkDataIntegrity')
    if ( this.totalErrorsCount > CheckerError.totalFixedCount ) {
      return loc('ptexte.error.data.invalid', {count:this.totalErrorsCount, fixed:CheckerError.totalFixedCount})
    } else if ( this.totalErrorsCount ) {
      // Il y avait des erreurs mais elles ont pu être fixées
      this.addMessage(`Errors: ${this.totalErrorsCount} Fixed: ${CheckerError.totalFixedCount}`)
      this.ptexte.saveAll()
    } else {
      // Aucune erreur trouvée
      this.addSuccess("No error found!")
    }
    // console.log("PTexte.loading (à la fin de checkDataIntegrity) = ", PTexte.loading)
  }


  /**
    @public

    Retourne UNDEFINED si les proximités sont correctement définies, sinon
    la TABLE DES ERREURS rencontrées.

    Vérifications
    =============
      Pour chaque proximité
      ---------------------
        - une proximité doit définir son motA et son motB
        - le mot A doit être un PMot existant
        - le mot B doit être un PMot existant
        - le motA et le motB doivent appartenir au même canon
        - le canon doit connaitre le mot motA
        - le canon doit connaitre le mot motB
        - le canon ne doit pas être un canon ignoré
        - Ni le motA ni le motB doivent être proximizable
        - la distance entre le motA et le motB doit justifier cette proximité
        - le motA doit définir son lien avec la proximité (_px_idN/P, proxN/P)
        - le motB doit définir son lien avec la proximité (id)

      Pour chaque mot
      ---------------
        - si un mot définit une proximité, cette proximité doit exister

  **/
  checkProximities(){
    X(1, '-> Checker::checkProximities')
    Proximity.forEach(prox => this.checkProximity(prox))
    this.addSuccess("Proximités vérifiées avec succès")
  }

  // ---------------------------------------------------------------------

}

module.exports = DATAChecker
