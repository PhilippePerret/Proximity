'use strict'
/** ---------------------------------------------------------------------
  *   Class Proximity
  *   ---------------
  *   Gestion des proximités dans le texte
*** --------------------------------------------------------------------- */

/**
  |
  | Classe Proximity
**/
class Proximity extends PTextElement /* en sursis */ {

  static log(msg){
    console.log(`%c[class Proximity][${now()}] ${msg}`, 'color:brown;')
  }


  static get SHORTPROP2PROP(){
    if (undefined === this._shortprop2prop) {
      this._shortprop2prop = {
         'i': {prop:'id',       type: 'string'}
       , 'a': {prop: 'motA_id', type: 'number'}
       , 'b': {prop: 'motB_id', type: 'number'}
       , 's': {prop: 'state',   type: 'number'}
     }

    } return this._shortprop2prop ;
  }

  static get ExposableProperties(){
    if ( undefined === this._exposableproperties ) {
      this._exposableproperties = Object.assign({}, this.SHORTPROP2PROP)
      Object.assign(this._exposableproperties, {

      })
    }
    return this._exposableproperties ;
  }
  /**
    Crée une nouvelle proximité entre le mota et le motb
    Cf. le manuel de développement sur les proximités
  **/
  static create(mota, motb){
    // C'est une première définition
    var dataProx = {
        id: this.newId()
      , motA: mota
      , motA_id: mota.id
      , motB: motb
      , motB_id: motb.id
    }
    // On crée une instance proximité
    const newProx = new Proximity(dataProx)

    // On définit les valeurs pour le mot A et le mot B
    mota.px_idN = newProx.id
    motb.px_idP = newProx.id

    // On "proximitize" les deux mots
    mota.proximitize()
    motb.proximitize()

  }


  /**
    Enregistrement des proximités
    -----------------------------
  **/
  static save(ptexte){
    if ( PTexte.saveLocked ) {
      console.warn('[Proximity] Sauvegarde verrouillée. Je ne sauve rien.')
      return
    }
    this._ptexte = ptexte
    fs.existsSync(this.path) && fs.unlinkSync(this.path)
    let data = Object.values(this.items).map( prox => {
      var d = []
      for( var k in this.SHORTPROP2PROP) {
        d.push(`${k}:${prox[this.SHORTPROP2PROP[k].prop]}`)
      }
      return d.join(' ')
      // return `i:${prox.id} a:${prox.motA_id} b:${prox.motA_id} s:${prox.state}`
    }).join("\n")
    fs.writeFileSync(this.path, data)
  }

  /**
    Proximité minimale générale
    ---------------------------
    Elle est de 1500 par défaut mais elle peut être rectifiée par la
    configuration propre au texte
  **/
  static get DISTANCE_MINIMALE(){
    const ptexte = this.ptexte || PTexte.current
    return ptexte.config.get('distanceMinimale')
  }

  /**
    Chargement des proximités
    @async

    +Params+::
      +ptexte+::[PTexte]  Le ptexte dont il faut charger les proximités
  **/
  static load(ptexte){
    X(1, 'Proximity::load (chargement des PROXIMITÉS)')
    return new Promise((ok,ko) => {
      const my = this
      my.reset()
      my._ptexte = ptexte
      const rl = ReadLine.createInterface({
        input: fs.createReadStream(my.path)
      })
      rl.on('line', (line) => {
        PTexte.loading || raise(LOADING_ABORTED)
        var dprox = {}
        line.split(' ').forEach(paire => {
          var [key, val] = paire.split(':')
          var reakKey = my.SHORTPROP2PROP[key].prop
          Object.assign(dprox, {[reakKey]: Number(val)})
        })
        // console.log("dprox:", dprox)
        new Proximity(dprox)
      })
      rl.on('close', () => {
        X(1, 'Données PROXIMITÉS chargées et dispatchées')
        my.loaded = true
        ok()
      })
    })
  }

  /**
    Retourne la proximité d'identifiant +prox_id+
    Undefined si elle n'existe pas
  **/
  static get(prox_id){
    if ( isNullish(prox_id) ) return
    return this.items[prox_id]
  }

  /**
    Supprime une proximité
    Note : surclasse la méthode héritée
  **/
  static beforeRemove(prox){
    // console.log("Destruction de la proximité #%d entre '%s' #%d et '%s' #%d", prox.id, prox.motA.real, prox.motA.id, prox.motB.real, prox.motB.id)
    if ( prox.motA ) {
      prox.motA.deproximitize()
      delete prox.motA._px_idN
      delete prox.motA._proxN
    }
    if ( prox.motB ) {
      prox.motB.deproximitize()
      delete prox.motB._px_idP
      delete prox.motB._proxP
    }
    return true
  }

  /**
    Suppression complète de toutes les proximités
  **/
  static removeAll(saving = false){
    this.forEach(prox => this.remove(prox))
    saving && this.save()
    this.reset()
  }


  /**
    Méthode qui checke les proximités
  **/
  static checkFromTo(fromMot, toMot) {
    var curMot = fromMot
    while(curMot){
      this.fixProximityAround(curMot)
      if ( curMot.id == toMot.id ) break ;
      curMot = curMot.next
    }
    if ( curMot.id != toMot.id ) {
      console.error("Bizarrement, le mot toMot n'a pas été atteint…")
    }
  }

  /**
    Fixage des proximités autour du mot +mot+ (pour les recréer si
    nécessaire)
  **/
  static fixProximityAround(mot){
    return this.setProximityAround(mot, /* onlyCheck */ false)
  }
  static checkProximityAround(mot){
    return this.setProximityAround(mot, /* onlyCheck */ true)
  }
  /**
    Étude des proximités autour du mot +mot+

    Cette méthode permet :
      - de gérer la suppression d'un mot qui était en proximité
      - de gérer la "déproximitisation" d'un mot (il n'a pas été supprimé mais
        on a supprimé sa possibilité d'être en proximité, il n'est plus étudié
        par la proximité)
  **/
  static setProximityAround(mot, onlyCheck = true){
    Busy.start('setProximityAround')
    const canon       = mot.icanon
    const indexMot    = canon.indexOf(mot)
    // SI
    //    le mot est le premier ou le dernier du canon,
    // ALORS
    //    Il est inutile de le checker
    // NON : car la méthode est utilisée aussi pour le unignore et le
    // mot +mot+ peut être le premier ou le dernier.
    // if ( indexMot === 0 || indexMot === canon.count - 1) return ;
    // SINON
    //    Il faut voir si de nouvelles proximités ont été créées
    const checkedProxs = canon.analyseProximities({fromItem:indexMot-1, toItem:indexMot+1, onlyCheck:onlyCheck})
    Busy.stop('setProximityAround')
    return checkedProxs // en cas de check
  }

  /**
    Remise à zéro des proximités

    Appelé à chaque ouverture de texte et lorsqu'il faut actualiser
    toutes les proximités. Après la fonction générale reset() de
    PTextElement
  **/
  static afterReset(){
    this.loaded = false
    delete this._path
    delete this._ptexte
  }

  /**
    Actualiser toutes les proximités depuis le mot +mot+

    Cela est nécessaire, par exemple, lorsque l'on a modifié les offsets
    suite à un remplacement de mot par un mot de longueur différente ou
    lorsque l'utilisateur demande d'actualiser suite à des changements.

    L'idée est qu'on doit updater jusqu'à la distance maximale du mot
    TODO
  **/
  static updateAllFrom(ptexte, mot, interactive) {
    this.ptexte = ptexte
    mot = mot || this.ptexte.firstMot
    mot || raise(loc('proximity.error.update.mot-required'))
    var len = 0
      , canon
      , curMot = PMot.get(mot.id)
      ;
    const maxOffset = curMot.absOffset + Proximity.DISTANCE_MINIMALE
    while(curMot && len < Proximity.DISTANCE_MINIMALE){
      canon = curMot.icanon
      canon.analyseProximities({fromItem:canon.indexOf(curMot), maxOffset:maxOffset})
      len += curMot.totalLength
      curMot = curMot.next
    }
  }

  static showNombre(){
    UI.containerInfosProximites.find('#nombre_proximites').innerHTML = this.count
  }
  static showPourcentage(){
    UI.containerInfosProximites.find('#pourcentage_proximites').innerHTML = `${this.calcPourcentage()} %`
  }

  static get count(){return Object.keys(this.items).length }

  /**
    Retourne le pourcentage de proximités

  **/
  static calcPourcentage(){
    return ( Math.round((this.count / PMot.count)*1000) ) / 10
  }

  /**
    Boucle sur toutes les proximités

    Un retour exactement égal à false de la fonction interrompt aussitôt
    la boucle
  **/
  static forEach(fun){
    if ( 'string' == typeof fun) {
      // Une méthode envoyée par string, par exemple forEach('remove')
      for ( var idx in this.items ) {
        if ( false === this.items[idx][fun].call(this.items[idx]) ) break ;
      }
    } else /* fun instancof Function */ {
      for ( var idx in this.items ) {
        if ( false === fun(this.items[idx]) ) break ;
      }
    }
  }

  static get path(){
    return this._path || (this._path = path.join(this.ptexte.inProx('proximities.data')))
  }

  static get ptexte(){ return this._ptexte }
  static set ptexte(v){this._ptexte = v}


  /** ---------------------------------------------------------------------
    |
    | INSTANCE DE LA PROXIMITÉ
    |
    | ---------------------------------------------------------------------
  **/

  /**
    Instanciation d'une proximité
    +Params+::
      +data+::[Object] Table contenant les informations sur les proximités
  **/
  constructor(data){
    super(data)
    this.data = data
    // for (var k in data) { this[`_${k}`] = data[k] }
    // this.constructor.add(this)

    /*
        Bindings
    */
    // this.observe = this.observe.bind(this)
    this.proximitize = this.proximitize.bind(this)
    this.deproximitize = this.deproximitize.bind(this)
  }

  /**
    Helper pour écrire une référence à l'objet
  **/
  get ref(){
    return this._ref || (this._ref = `<<${this.class.name} #${this.id}>>`)
  }

  // Pour la clarté (this.class au lieu de this.constructor)
  get class(){return this.constructor}

  log(msg){
    Log.write(`${this.ref}`, `color:${this.constructor.consoleColor}`, msg)
  }



  /**
    Mettre en place la proximitisation des deux mots

    N0001
      Mais en fait, on n'utilise pas cette méthode, car dans la méthode
      PPhrase#proximitize elle serait appelée deux fois sur le mot étudié,
      ce qui poserait un problème de double obervateur.

  **/
  proximitize(){
    console.warn('Ne pas utiliser la méthode Proximity#proximitize() (cf. la note N0001)')
    // this.motA.proximitize()
    // this.motB.proximitize()
  }

  /**
    Défaire la proximitisation des deux mots
  **/
  deproximitize(){
    this.motA.deproximitize()
    this.motB.deproximitize()
  }

  /**
    Span DOM du mot A et du mot B de la proximité
  **/
  get spanA(){return this.motA.span}
  get spanB(){return this.motB.span}

  get id(){return this._id}

  get state(){return this._state || 0}
  set state(v){
    this._state = v
    // TODO
    console.warn("IL FAUT GÉRER LE CHANGEMENT DE STATUT DE LA PROXIMITÉ.")
  }

  /**
    Définir ou récupérer le mot A
  **/
  get motA(){
    return this._motA || ( this._motA = PMot.get(this.motA_id) )
  }
  get motA_id(){return this._motA_id}
  set motA(v){
    this._motA_id = v.id
    this._motA = v
  }

  /**
    Définir ou récupérer le mot B
  **/
  get motB_id(){return this._motB_id}
  get motB(){
    return this._motB || ( this._motB = PMot.get(this.motB_id) )
  }
  set motB(v){
    this._motB_id = v.id
    this._motB = v
  }

  /**
    La distance entre les deux mots, en nombre de signes
  **/
  get distance(){
    return this._distance || (this._distance = this.calcDistance())
  }
  set distance(v){this._distance = v}

  calcDistance(){
    // ;(this.motA && this.motB) || raise(this.messageErrorCalcDistance)
    if ( this.motA && this.motB ) {
      return Math.abs(this.motB.offset - (this.motA.offset + this.motA.length))
    } else {
      return 0
    }
  }
  get messageErrorCalcDistance(){
    var msg = loc('proximity.error.mots.undefined', {id:this.id})
    var precis = []
    this.motA || precis.push(loc('proximity.error.mots.motA.not-defined'))
    this.motB || precis.push(loc('proximity.error.mots.motB.not-defined'))
    msg = `${msg} ${precis.join(', ')}`
    console.error(this) // pour voir la proximité
    return msg
  }

  /**
    La distance en pourcentage par rapport à la distance maximale
  **/
  get pourcentageDist(){
    return this._pctdist || (this._pctdist = 100 * this.distance / this.distanceMinimale)
  }

  /**
    La distance maximale pour ne plus avoir de proximité

    C'est une valeur par défaut, sauf définition explicite
  **/
  get distanceMinimale(){
    return this._distmax || (this._distmax = this.motA.distanceMinimale )
  }

}
