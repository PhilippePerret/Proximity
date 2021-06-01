'use strict'

const NLP = require('nlp-js-tools-french')
/** ---------------------------------------------------------------------
  *   Classe TextAnalyze
  *
  * Pour la gestion des analyses de texte appelées depuis l'application

C'est ce module qui est en relation avec le module ruby `analyse_texte.rb` qui
produit une analyse du texte qu'on lui soumet.
TextAnalyse permet de récupérer tous les résultats obtenus.


Pour créer un texte piège à essayer :

- avec 'Peut-être' (va-t-il le garder entier ?)
- avec 'Il'
- avec 'pouvait-il'
- avec 'Ça'
- avec "qu'il"    (apostrophe simple droit)
- avec "qu’elle"  (apostrophe simple courbe)
- avec un retour charriot
- avec 'grand-chose' (qui doit être considéré comme une mot unique)
- avec '«&nbsp;' ou '&nbsp;»' car les insécables ont l'air d'être replacées
  par leur entité HTML même quand on est en UTF8


*** --------------------------------------------------------------------- */
class TextAnalyze {

  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /**
    Initialisation de la classe
  **/
  static init(){

  }

  static get config() {
    if (undefined === this._config) {
      this._config = {
        tagTypes: ["adj", "adv", "art", "con", "nom", "ono", "pre", "ver", "pro"],
        strictness: true,
        minimumLength: 1,
        debug: false
      }
    } return this._config
  }

  // /**
  //   Commande pour lancer l'analyse du texte côté serveur
  // **/
  // static get ABS_COMMAND_PATH(){
  //   return path.resolve('./bin/analyse_texte.rb')
  // }
  //
  // /**
  //   Commande pour lancer l'analyse du paragraphe (texte) côté serveur.
  // **/
  // static get ABS_GETMOTS_COMMAND_PATH(){
  //   return path.resolve('./bin/get_mots.rb')
  // }

  static get current(){
    return this._current
  }
  static set current(v){
    this._current = v
  }


  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */

  /**
    Instanciation
  **/
  constructor(ptexte){
    this.ptexte = ptexte
    // this.analyze = this.analyze.bind(this)
    // this.analyzeAndOpen = this.analyzeAndOpen.bind(this)
    this.analyzeParagraph     = this.analyzeParagraph.bind(this)
    this.withNlpJsToolsFrench = this.withNlpJsToolsFrench.bind(this)
  }

  log(msg){
    Log.write('[inst TextAnalyze]', 'color:purple;', msg)
  }

  /**
    Analyse le paragraphe d'id +paragId+ qui contient le texte +texte+

  **/
  analyzeParagraph(parag, texte) {
    this.log(`-> analyzeParagraph (paragraph #${parag.id})`)
    try {
      return this.withNlpJsToolsFrench(texte)
    } catch (e) {
      console.error(e)
    } finally {
      this.log('<- analyzeParagraph (async)')
    }
  }

  /**
    Lémmatisation avec nlp-js-tools-french

    @return la liste des mots trouvés (avec toutes les données pour
    produire les mots {PMot}).

  **/
  withNlpJsToolsFrench(corpus){
    this.log('-> withNlpJsToolsFrench')
    // console.log("Contenu : ", corpus)
    var nlp = new NLP(corpus, this.constructor.config);
    // console.log("nlp.tokenized", nlp.tokenized)
    const lemmatizer = nlp.lemmatizer()
    // console.log("nlp.lemmatizer", lemmatizer)
    let tableLemma = {}
    lemmatizer.forEach(dlemma => {

      // Pour les doubles appartenances (quand le mot appartient à deux
      // canons)
      tableLemma[dlemma.id] || Object.assign(tableLemma, {[dlemma.id]: []})

      // Quelques corrections de lémmatisation
      switch(dlemma.lemma){
        case 'l':case 's':case 'd': case 'qu':
          dlemma.lemma += 'e'
      }

      // On ajoute ce canon
      tableLemma[dlemma.id].push(dlemma.lemma)

      // Pour les canons, je préfère le second, donc on inverse toujours
      // la liste
      tableLemma[dlemma.id].reverse()

    })

    // On compose les mots
    // nlp.tokenize contient les mots tels qu'ils sont vraiment dans
    // le paragraphe.
    let portion = String(corpus)
    var curOffset = 0
    var dataMots = []
    var imot = 0
    var nombreMots = nlp.tokenized.length
    for(imot; imot < nombreMots; ++imot ){
      var real = nlp.tokenized[imot]
      var canon = PMOT_REALMOT2REALCANON[real] ? PMOT_REALMOT2REALCANON[real] : tableLemma[imot][0]
      var dataMot = {
          real:       real
        , length:     real.length
        , canon:      canon
        , canon_alt:  tableLemma[imot][1]
        , relOffset:  curOffset
        , tbw:        null
      }
      // Index dans ce qui reste du paragraphe
      var index = portion.indexOf(real)
      // Ce qu'il y a à mettre dans le mot précédent
      if ( index > 0 ) {
        // Il faut rectifier l'offset
        dataMot.relOffset += index
        curOffset += index
        // Il faut définir le tbw du mot avant ou le texte before du premier
        // mot.
        var tbw = portion.substring(0, index)
        if (imot > 0) {
          dataMots[imot-1].tbw = tbw
        } else {
          dataMot.before = tbw
        }
        // On prend ce qui reste
        portion = portion.substring(index, portion.length)
      } else {
        // C'est le mot juste là => rien à mettre dans le mot précédent
      }
      dataMots.push(dataMot)
      portion = portion.substring(real.length, portion.length)
      curOffset += real.length
    };//fin de boucle sur tous les mots

    // On ajoute la fin du paragraphe
    if ( dataMots[imot-1] ) {
      dataMots[imot-1].tbw = portion
    } else {
      console.warn("dataMots[imot-1] (imot-1 = %d) non défini => impossible de mettre son tbw à '%s' (dataMots = )", imot-1, portion, dataMots)
    }

    // console.log("dataMots:,", dataMots)
    this.log('<- withNlpJsToolsFrench')
    return dataMots
  }

  /**
    Path du fichier texte initial
  **/
  get path(){
    return this._path || (this._path = this.ptexte.initPath)
  }
}
