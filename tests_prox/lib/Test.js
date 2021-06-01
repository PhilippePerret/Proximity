'use strict';

global.Eval       = require('./Evaluation.js') // TestProx en a besoin aussi
const TTexte      = require('./TTexte.js')
const TOperation  = require('./TOperation.js')

class Test {
  constructor(yamlIFile){
    this.yamlIFile = yamlIFile
    TConsole.path(`Test de '${App.relativePath(yamlIFile.path)}'`)
  }

  log(msg){
    VERBOSE && TConsole.raw(`[${this.ref}] ${msg}`)
  }

  get ref(){
    return this._ref || (this._ref = `TEST ${this.superRelativePath}`)
  }

  get superRelativePath(){
    if (undefined === this._superrelpath) {
      this._superrelpath = App.relativePath(this.yamlIFile.path).replace(/\.\/tests_prox\/tests\//,'')
    } return this._superrelpath ;
  }

  run(){
    this.log('-> run (promise)')
    return new Promise((OK,ko)=>{
      try {
        // check de l'état (mots, canons, proximités)
        this.checkState(this.data) || raise("# État invalide #")
        this.doOperations()
        .then(OK)
        .catch(ko)
      } catch (err) { ko(err) }
    })
    this.log('<- run')
  }


  /**
    @sync
    Méthode qui exécute les opérations du fichier
  **/
  doOperations(){
    this.log('-> doOperations')
    var dope ;
    return new Promise(async (OK,ko) => {
      try {
        this.log('--> début du jeu des opérations')
        const odata = this.data.operations
        if (odata){
          while(dope = odata.shift()){
            const tope = new TOperation(this, dope)
            this.log(`--> On joue l'opération '${tope.titre}'`)
            await tope.run()
            this.log(`<-- Fin de l'opération '${tope.titre}'`)
          }
        }
        this.log('<- doOperations OK()')
        OK()
      } catch (err) {ko(err)}
    })
    this.log('<- doOperations')
  } // /doOperations


  /**
    Méthode générique où +chose+ peut être 'mot', 'canon' ou 'proximites',
    pour procéder au check de cet élément

    +Params+::
      +chose+:: [String] La chose à checker, en minuscule
      +data+:: [Object] La table des données attendues
  **/
  checkElement(chose, data, options) {
    const [CHOSE, classe, ttexteTable] = ((chose) => {
      switch(chose){
        case 'mot': return ['MOT', PMot, this.ttexte.mots] ;
        case 'canon': return ['CANON', PCanon, this.ttexte.canons] ;
        case 'proximité': return ['PROXIMITÉ', Proximity, this.ttexte.proximites] ;
        default: raise('- inconnu -')
      }
    })(chose)

    // Le nombre de failures actuel
    const oldFailureCount = Number(Eval.failureCount)
    // Faut-il donner un état des lieux en console ? (utile au moment de la
    // rédaction des tests, par exemple)
    data.expose && classe.exposeTest(options)
    // Premier test : nombre de mots
    data.nombre && new Eval(`Nombre de ${chose}s`, data.nombre, ttexteTable.nombre, options)
    // Second test : les mots définis
    data.items && this.checkItems(data.items, classe, chose, CHOSE, options)
    // Troisième test : les mots inexistants
    data.null_items && this.checkNullItems(data.null_items, classe, chose, CHOSE, options)
    // Le nouveau nombre de failures
    const newFailureCount = Number(Eval.failureCount)
    // Nombre de failures pour ce test (TODO Plus tard, on pourra peut-être en
    // faire quelque chose)
    const failureCount = newFailureCount - oldFailureCount
    return failureCount > 0
  }

  /**
    Méthode générique (pour tous) permettant de checker les items définis
    Cf. les méthodes suivantes

    Note : sous méthode de checkElement
  **/
  checkItems(items, classe, nameSing, nameMaj, options) {
    var e = null ;
    items.forEach( ditem => {
      const item = classe.get(ditem.id)
      e = new Eval(`Existence ${nameSing} #${ditem.id}`, true, item != undefined, options)
      if ( e.resultat == false ) return // inutile de poursuivre
      for (var prop in ditem) {
        new Eval(`[${nameMaj||nameSing} #${item.id}] '${prop}' property`, ditem[prop], item[prop], options)
      }
    })
  }

  /**
    Méthode qui vérifie la liste des ids qu'on ne doit plus trouver
    dans les classes +classe+
    Requis : une méthode de classe `get` pour récupérer les objets, et qui
    doit renvoyer null si l'objet n'existe pas
  **/
  checkNullItems(ids, classe, nameSing, nameMaj, options) {
    ids.forEach( id => {
      const item = classe.get(id)
      new Eval(`Inexistence  de ${nameMaj} #${id}`, true, !item, options)
    })
  }


  /**
    Méthode appelée lorsque la donnée 'mots' est définie dans le fichier
    de tests YAML
    Ou qu'on doit vérifier un état initial ou final

    +return+:: [Boolean] True si aucune erreur n'a été trouvée, false otherwise
  **/
  checkMots(data, options){
    return this.checkElement('mot', data, options)
  }


  /**
    =main=
    Méthode principale appelée quand des données canons sont définies dans
    le fichier YAML

    Ou qu'on doit vérifier l'état initial ou final d'une opération

    +return+:: [Boolean] True si aucune erreur n'a été trouvée, false otherwise
  **/
  checkCanons(data, options){
    return this.checkElement('canon', data, options)
  }

  /**
    = main =

    Méthode principale qui check les proximités si elles sont définies
    dans le fichier de test
  **/
  checkProximites(data, options){
    return this.checkElement('proximité', data, options)
  }

  /**
    Méthode très importante qui vérifie que l'état actuel du texte
    correspondent à +state+

    +Params+::
      +state+:: [Object]  Table définissant l'état des mots, des canons,
                          des proximités principalement.
      +options+:: [Object]  Table des options, dont :
          silence:    Si true, on n'affiche que les messages d'erreur

    +return+:: [Boolean] True si le check est OK, false dans le cas contraire
  **/
  checkState(state, options) {
    try {
      Eval.resetCount()
      state.mots && this.checkMots(state.mots, options)
      state.canons && this.checkCanons(state.canons, options)
      state.proximites && this.checkProximites(state.proximites, options)
      return Eval.failureCount == 0
    } catch (err) {
      TConsole.error(err)
      return false
    }
  }

  /**
    Retourne une instance TTexte qui correspond en fait au PTexte courant,
    avec des méthodes utiles
  **/
  get ttexte(){
    return this._ttexte || (this._ttexte = new TTexte() )
  }

  get data(){
    return this._data || (this._data = this.yamlIFile.data)
  }
}

module.exports = Test
