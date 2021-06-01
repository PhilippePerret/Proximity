'use strict'
/** ---------------------------------------------------------------------
  *   Classe PCanon
  *   Gestion des canons de mot
  *

Note : les canons ne sont pas enregistrés (pour le moment). Ils sont
renseignés à chaque chargement de texte (de toute façon, il faut instancier
tous les mots, donc…)

Attention : pour obtenir les canons, contrairement aux autres classes qui
héritent de PTextElement, il faut utiliser la méthode .getByNom.
*** --------------------------------------------------------------------- */
class PCanon extends PTextElement {

  /** ---------------------------------------------------------------------
    *
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */


  static get consoleColor(){return 'purple'}

  /**
    Propriétés permettant de "décompresser" le fichier des données
    enregistrées.
  **/
  static get SHORTPROP2PROP(){
    if (undefined === this._shortprop2prop){
      this._shortprop2prop = {
          'i': {prop:'id',    type:'number'}
        , 's': {prop:'state', type:'number'}
        , 'c': {prop:'canon', type:'string'}
      }
    }
    return this._shortprop2prop ;
  }
  /**
    Propriétés augmentées qui servent au débuggage, et notamment
    à l'exposition des valeurs dans les tests
  **/
  static get ExposableProperties() {
    if (undefined === this._exposableproperties) {
      this._exposableproperties = Object.assign({}, this.SHORTPROP2PROP)
      Object.assign(this._exposableproperties,{
          'm2i': {prop:'motsId2Index',      type:'object'}
        , 'its': {prop: 'items',            type:'array'}
        , 'dim': {prop:'distanceMinimale',  type: 'number'}
      })
    }
    return this._exposableproperties ;
  }


  /**
    Appelée après la méthode PTextElement#reset pour affiner l'initialisation
    de la classe PCanon
  **/
  static afterReset(){
    this.itemsByNom = {}
    delete this._ptexte
    delete this._path
  }

  static getByNom(canon){
    return this.itemsByNom[canon]
  }

  /**
    Au chargement, on doit préparer la liste
  **/
  static makeItemsByNom(){
    this.forEachItem(canon => Object.assign(this.itemsByNom, {[canon.canon]: canon}))
  }
  /**
    Ajoute le mot {PMot} +mot+ à son canon (à la fin)
    On retourne toujours l'instance du canon
    Note : pour ajouter un mot à un endroit précis du canon (par rapport
    à son offset), il faut utiliser la méthode canon.insert(mot)
  **/
  static addMot(mot){
    const canon = this.getByNom(mot.canon) || this.create(mot.canon)
    canon.addItem(mot)
    return canon
  }

  /**
    Création d'un nouveau canon
  **/
  static create(canon){
    const newCanon = new PCanon({canon:canon})
    Object.assign(this.itemsByNom, {[canon]: newCanon})
    newCanon.isNew = true
    return newCanon
  }

  /**
    Retourne le canon du mot +motStr+
    ---------------------------------
    Le crée si nécessaire
    Donc, dans tous les cas, un PCanon est retourné. La différence est
    que le nouveau canon possède une propriété 'isNew' à true
    Note : il serait aussi possible de voir son nombre d'items, mais il
    peut être à zéro même sans être nouveau.
  **/
  static getOrCreateForMot(motStr){
    const analyzor = new TextAnalyze()
    var newCanon = analyzor.withNlpJsToolsFrench(motStr)[0].canon
    return this.getByNom(newCanon) || this.create(newCanon)
  }

  /**
    Sauvegarde des canons
  **/
  static save(ptexte){
    const my = this
    if ( PTexte.saveLocked ) {
      console.warn('[PCanon] Sauvegarde verrouillée. Je ne sauve rien.')
      return
    }
    ptexte && (this._ptexte = ptexte)
    fs.existsSync(this.path) && fs.unlinkSync(this.path)
    // On profite du stringifying des données des canons pour
    // supprimer ceux qui n'ont plus d'items
    let data = []
    Object.values(this.items).forEach( canon => {
      if ( canon.items.length ) {
        // Il y a des mots
        var d = []
        for( var k in this.SHORTPROP2PROP) {
          d.push(`${k}:${canon[this.SHORTPROP2PROP[k].prop]}`)
        }
        delete canon.isNew // il ne peut plus l'être
        data.push(d.join(' '))
      } else {
        // Ce canon n'a plus de mots, on peut le détruire
        my.remove(canon)
        console.warn("Ce canon a été supprimé :", canon)
      }
      // return `i:${canon.id} a:${canon.motA_id} b:${canon.motA_id} s:${canon.state}`
    })
    fs.writeFileSync(this.path, data.join("\n"))
  }

  /**
    Chargement du fichier des canons (s'il existe)
    Note : il faut le faire avant de charger les mots car les données
    canon ne contiennent par leurs mots, ils sont réinterprétés à chaque
    fois.
  **/
  static load(ptexte){
    const my = this
    X(1, '-> PCanon::load (chargement des canons)')
    return new Promise((ok,ko) => {
      my.reset()
      my._ptexte = ptexte
      if ( false == fs.existsSync(this.path) ) {
        X(1,'Pas de données canons')
        return ok()
      }
      const rl = ReadLine.createInterface({
        input: fs.createReadStream(my.path)
      })
      rl.on('line', (line) => {
        var dCanon = {}
        line.split(' ').forEach(paire => {
          var [key, val] = paire.split(':')
          var dataShortProp = my.SHORTPROP2PROP[key]
          var reakKey = dataShortProp.prop
          switch (dataShortProp.type) {
            case 'string':
              val = String(val)
              break;
            case 'number':
              val = Number(val)
              break
            default:
              // Ne rien changer
          }
          Object.assign(dCanon, {[reakKey]: val})
        })
        // console.log("dCanon:", dCanon)
        new PCanon(dCanon)
      })
      rl.on('close', () => {
        X(1, 'Données CANONS chargées et dispatchées')
        my.makeItemsByNom()
        my.loaded = true
        ok()
      })
    })
  }

  /**
    Actualisation des distances minimales des canons
    (lorsqu'elle a été modifiée dans les configurations)
    Note : les distances seront automatiquement recalculées pour
    la page affichée.
  **/
  static updateAllDistancesMinimales(newDistanceDefault){
    this.forEachItem(canon => delete canon._distanceminimale)
  }

  static analyseAllProximities(saving = false) {
    this.forEachItem('analyseProximities')
  }


  static get path(){
    return this._path || (this._path = path.join(this.ptexte.inProx('canons.data')))
  }
  static get ptexte(){return this._ptexte}

  /** ---------------------------------------------------------------------
    *
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */

  /**
    Instanciation d'un canon
  **/
  constructor(data){
    super(data)
  }

  /*
    Data methods
  */
  reset(){
    delete this._motsid2index
    delete this._count
  }

  /*
    Items methods
  */

  /**
    Méthode pour insérer le mot +mot+
    ----------------------------------
    Noter qu'il ne s'agit pas de l'insertion lorsqu'on calcule le texte,
    mais lorsqu'on modifie le texte, ici le mot +mot+. Le mot a été retiré
    de son ancien canon et doit être.
    Pour trouver sa place, on parcourt les offsets des mots courants

    +Params+::
      +mot+::[PMot] L'instance du mot à insérer
      +checkProx+::[Boolean] Si TRUE (défaut), la méthode checke les proximités
          que cela crée. Sinon, il faudra le faire plus tard.
  **/
  insert(mot, checkProx = true){
    // X().setMaxLevel(9)
    var indexInsertion = null
    for(var i=0; i< this.count; ++i){
      if ( this.items[i].offset > mot.offset ) {
        // console.log("Place trouvée avant #%d (mot:%d)", this.items[i].id, mot.offset, this.items[i].offset)
        indexInsertion = Number(i)
        break // on peut s'arrêter là
      }
    }
    if ( indexInsertion === null ) indexInsertion = this.count // à la fin

    // Si le mot avant et le mot après sont en proximité, il faut commencer
    // par détruire cette proximité
    if (indexInsertion > 0 && indexInsertion < this.count) {
      const motPrev = this.items[indexInsertion - 1]
      const motNext = this.items[indexInsertion] // il n'a pas encore été retiré
      if ( motPrev.proxN ) {
        // c'est forcément le motNext, mais on s'en assure quand même
        if ( motPrev.proxN.motB.id == motNext.id ) {
          Proximity.remove(motPrev.proxN)
            // Noter que ça détruit fatalement, du même coup, la proximité
            // previous défini dans le mot suivant
        } else {
          console.error("J'ai un problème : le mot suivant en proximité ne correspond pas à mes attentes…")
          console.error("motPrev = ", motPrev)
          console.error("motNext = ", motNext)
          raise("Impossible de poursuivre")
        }
      }
    }

    // console.log("[PCanon]#insert this.items = %s", JSON.stringify(this._motsid2index))
    this.items.splice(indexInsertion,0,mot)
    // console.log("[PCanon]#insert this.items après = %s", JSON.stringify(this._motsid2index))
    this.reset() // pour forcer le recalcul des choses
    // Pour mettre ou non en proximité
    var from = indexInsertion ? indexInsertion - 1 : 0
    checkProx && this.analyseProximities({fromItem:from, toItem:indexInsertion + 1})
    // X().unsetMaxLevel()
  }

  /**
    Méthode pour supprimer le mot +mot+ du canon
  **/
  remove(mot){
    // console.log("[PCanon]#remove this.items = %s", JSON.stringify(this._motsid2index))
    const indexMot = Number(this.indexOf(mot))
    this.items.splice(indexMot,1)
    // console.log("[PCanon]#remove this.items après = %s", JSON.stringify(this._motsid2index))
    // Il faut tout recalculer
    this.reset()
    // Pour mettre ou non en proximité
    var from = indexMot ? indexMot - 1 : 0
    this.analyseProximities({fromItem:from, toItem:indexMot + 1})
  }

  /*
    Proximities methods
  */

  /**
    Analyse les proxmités du canon
    +Params+::
      +data+:: [Object] Table des données, qui peut contenir :
        +fromItem+  ::[Number]    L'index du mot de départ à analyser
        +toItem+    ::[Number]    L'index du mot de fin à analyser
        +maxOffset+ ::[Number]    L'offset maximal jusqu'où checker.
        +checkOnly+ ::[Boolean]   Si true, on ne "marque" pas la proximité, on en
            renvoie simplement l'information. Cette fonctionnalité est utilisée
            par exemple pour signaler une probable proximité avec un mot modifié.
            Si false (défaut), on crée la proximité.
    +Return+
      Rien si checkOnly est false
      Si checkOnly est vrai :
        - retourne la liste des proximités trouvées, sous forme d'une liste
          [Array] de table {motA,motB}
        - si aucune proximité trouvée, retourne undefined.
  **/
  analyseProximities(data = {}){
    Busy.start('canon-analyseProximities')
    X(3,'-> PCanon#analyseProximities', {this:this, data:data} )
    var lastIndex
      , checkOnlyList = []
      , imot = 0
      ;

    var fromItem  = data.fromItem || 0
    var toItem    = data.toItem || null
    var maxOffset = data.maxOffset || null
    var checkOnly = data.checkOnly || false

    // console.log("Analyse des proximités du canon #%d ('%s')", this.id, this.canon, this.items)
    // Si le canon n'est pas proximizable (pas assez d'items, trop court,
    // exclu ou retiré), on ne l'étudie pas.
    if ( false === this.isProximizable ){ // pas de proximités possible
      X(7,'Canon non proximizable, analyse de proximité inutile')
      Busy.stop('canon-analyseProximities')
      return
    }
    // Calcul du bon premier index à prendre en compte
    if ( fromItem >= this.count ) {
      raise(loc('canon.update.error.start-index-exceed-max', {istart:fromItem, last:this.count - 1}))
    } else if ( fromItem < 0 ) {
      // Ça arrive quand le mot est le premier, par exemple
      fromItem = 0
    }
    // Calcul du bon dernier index à prendre en compte
    if ( toItem == -1 ) {
      lastIndex = this.count - 1
    } else if ( toItem ) {
      lastIndex = toItem + 1
    } else {
      lastIndex = this.count - 1 // mais peut-être un offset max est défini
    }
    lastIndex < this.count || (lastIndex = this.count - 1)  /* [1] */
    // La liste pour mettre les proximités si c'est un simple check
    /**
      En fait, la boucle doit être plus complexe :
      IL faut trouver le premier mot proximizable et le comparer à son
      prochain mot proximizable. Car le mot peut avoir été exclu.
    **/
    X(7,`Vérification des proximités du canon ${fromItem} au canon ${lastIndex}`, {canon: this.canon})
    for (imot = fromItem ; imot < lastIndex; ++imot){
      var mot = this.items[imot]
      if ( maxOffset && mot.absOffset > maxOffset ) {
        console.log("L'offset max est atteint, je m'arrête là")
        break
      }
      if ( mot.notProximizable ){
        X(8, 'Mot non proximizable, je le passe', {mot:mot})
        continue ;
      }
      // On recherche le prochain mot proximizable
      var inex = 1 + Number(imot)
      X(8, 'Le mot peut être analysé', {mot:mot, index:imot, 'index suivant':inex})
      for (; inex <= lastIndex; ++inex) {
        var nex = this.items[inex] // existera toujours due to [1]
        if (nex.notProximizable){
          X(8, 'Mot suivant non proximizable, je le passe', {nex:nex})
          continue
        }
        X(8, 'Mot next proximizable, je le prends', {mot:mot, nex:nex})
        // Les deux mots trouvés sont proximizables
        // ---------------------------------------
        // On peut les étudier
        if ( this.areToClose(mot, nex)) {
          X(8, 'Les deux mots sont proches', {mot:mot, nex:nex})
          if (checkOnly) {
            X(8, 'Mémorisation de la proximité (check only)')
            checkOnlyList.push({motA:mot, motB:nex})
          } else {
            X(8, 'Création de la proximité entre les deux mots', {mot:mot, nex:nex})
            Proximity.create(mot, nex)
          }
          break // on passe au suivant
        } else {
          X(8, "Les deux mots ne sont pas proches.")
        }
      }
    } // fin de boucle sur tous les mots
    Busy.stop('canon-analyseProximities')
    if ( checkOnlyList.length ) return checkOnlyList ;
    else return undefined ;
  }

  areToClose(mota, motb) {
    // console.log("motb.offset < mota.offset + this.distanceMinimale => %d < %d + %d", motb.offset, mota.offset, this.distanceMinimale)
    return this.offsetsToClose(mota.offset, motb.offset)
  }

  offsetsToClose(offseta, offsetb){
    // console.log("[PCanon#offsetsToClose] offsetb < offseta + this.distanceMinimale => %d < %d + %d", offsetb, offseta, this.distanceMinimale)
    return offsetb < offseta + this.distanceMinimale
  }

  /**
    Retourne TRUE si ce canon peut être analysé
    Un canon n'est pas analysable si :
      - il est trop court (moins de 3 lettres)
      - il appartient aux canons à exclure
      - son état a été marqué STATE_IGNORE_ALL
  **/
  get isProximizable(){
    try {
      this.count > 1                    || raise('un seul item')
      this.canon.length > 2             || raise('trop court')
      PMOT_EXCLUDED_CANON[this.canon]   && raise('liste d’exclusion')
      this.state & STATE_IGNORE_ALL     && raise('marqué ignoré')
      return true
    } catch (e) {
      // Ne rien marquer
      this.nonProximizableReason = e // pour le rapport
      return false
    }
  }

  /*
    Items méthodes
  */

  /**
    Retourne l'index, dans le canon, du mot +mot+ [PMot]
  **/
  indexOf(mot){
    return this.motsId2Index[mot.id]
  }

  get motsId2Index(){
    return this._motsid2index || (this._motsid2index = this.defineIndexedLists())
  }

  /**
    Méthode qui checke pour voir si un item placé à l'offset +offset+ créerait
    une proximité. Renvoie true si oui.
  **/
  whatIfNewItemAt(offset) {
    X(2, '-> PCanon#whatIfNewItemAt(${offset})', {offset:offset})
    if ( this.notProximizable ) return null ; // pas de proximités possible
    if ( this.count < 2 ) return null ;
    for(var mot of this.items ) {
      if ( mot.notProximizable ) continue ;
      X(9, 'Comparaison de ${mot_offset} avec ${offset}', {mot_offset:mot.offset, offset:offset, mot:mot})
      X(9, 'Comparer ${min_offset} à ${max_offset} avec Distance Minimale ${DMin}',{min_offset:Math.min(mot.offset, offset), max_offset:Math.max(mot.offset, offset), DMin:this.distanceMinimale})
      if ( this.offsetsToClose(Math.min(mot.offset, offset), Math.max(mot.offset, offset)) ) {
        return mot
      }
    }
    return null // pas de proximité
  }

  /**
    Définit la liste motsId2Index qui permet de trouver rapidement
    l'index d'un mot d'après son identifiant.

    La méthode définit aussi la propriété `indexInCanon` du mot
  **/
  defineIndexedLists(){
    var h = {}
    for(var imot = 0; imot < this.count; ++imot){
      var mot = this.items[imot]
      Object.assign(h, {[mot.id]: Number(imot)})
      mot.indexInCanon = Number(imot)
    }
    return h
  }

  get count(){
    return this._count || (this._count = this.items.length)
  }

  /**
    Pour ignorer ce canon
  **/
  ignore(){
    this.addState(STATE_IGNORE_ALL)
    // Il faut aussi déproximitiser tous les items
    this.items.forEach(mot => mot.hasProximites && mot.deproximitize())
    const cancel = new Cancelisation({eval:`PCanon.get(${this.id}).unignore()`})
    flash(loc('canon.ignore.confirmation',{annuler:cancel.link}))
  }

  unignore(){
    this.removeState(STATE_IGNORE_ALL)
    this.constructor.save()
    this.analyseProximities()
    flash(loc('canon.unignore.confirmation'))
  }

  /**
    Ajouter un état
  **/
  addState(value){
    this.state = this.state | value
    this.constructor.save()
  }

  removeState(sta){
    this.state | sta && ( this.state -= sta )
    this.constructor.save()
  }

  /**
    La distance minimale
  **/
  get distanceMinimale(){
    return this._distanceminimale || ( this._distanceminimale = this.defineDistanceMinimale())
  }

  /**
    Calcul la distance minimale requise pour ce canon
  **/
  defineDistanceMinimale(){
    var d
    if ( PMOT_SPEC_DISTANCES_CANONS[this.canon] ) {
      return Math.min(PMOT_SPEC_DISTANCES_CANONS[this.canon].distanceMinimale, Proximity.DISTANCE_MINIMALE)
    } else {
      return Proximity.DISTANCE_MINIMALE
    }
  }

  /**
    Les items (instances PMot) mais sous forme de données
    jsonabilisable, pour les tests, notamment
  **/
  get jsonable_items(){
    return this.items.map(mot => mot.jsonable)
  }
  /**
    Le mot canonique
  **/
  get canon(){ return this._canon }

  /**
    L'état
  **/
  get state(){return this._state || 0}
  set state(v){this._state = v}
}
