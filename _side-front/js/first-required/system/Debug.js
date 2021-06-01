'use strict';
/** ---------------------------------------------------------------------
  Classe Debug
  ------------
  Pour un système de débuggage de l'application

  # Version 0.1.1
  ----------------
  # 0.1.1
      La méthode setMaxLevel démarre le débuggage s'il est off
  # 0.1.0
      Première mise en place.

  Utiliser l'alias X

  Pour définir le niveau minimal de débug :

    X().maxLevel = <valeur de 0 — aucun message - à 9 - tous les messages>
    ou  Debug.maxLevel = <valeur>
    ou X().level = <valeur>
    ou Debug.level = <valeur>
    Valeur par défaut : 3

  X().on()    ou Debug.on()    réactive le débuggage après un arrêt par X.off() ou X.stop()
  X().start() ou Debug.start() idem
  X().off()   ou Debug.off()    Arrêtet le debuggage
  X().stop()  ou Debug.stop()

  Pour modifier localement le niveau max, afin que les messages de détail
  s'affiche, on peut mettre le code entre :

      X().setMaxLevel(<niveau)  ou    Debug.setMaxLevel(<niveau>)
      ... code ...
      X().unsetMaxLevel()       ou    Debug.unsetMaxLevel()
      // Remet au niveau précédent

*** --------------------------------------------------------------------- */
class Debug {
  static get maxLevel(){
    if ( undefined === this._maxlevel /* peut être égal à 0 */) {
      this._maxlevel = 3
    } return this._maxlevel ;
  }
  static set maxLevel(v){
    this._maxlevel = v
    this.debug(1, `Niveau debug mis à ${v}`)
  }
  static set level(v){this._maxlevel = v}

  /**
    Méthode principale

    Par exemple :

        X(4, "Le message de débuggage", {variable: value})
      ou
        X(4, "Le message de débuggage", this)

      Dans ce dernier cas (le meilleur), `this` est l'objet qui utilise
      le débug et il doit définir une méthode `refDegub` qui renvoie la
      référence humaine à l'instance/classe en question. Dans le cas
      contraire, on se contentera d'écrire "<classe>#<id>"

      Dans le premier cas, on peut envoyer toute sorte de valeurs, même
      des objets. On peut avoir par exemple :
      X(1, "Le message de débuggage", {objet:this, var: maVariableObjet})
      `objet` et `var` seront vraiment écrits comme des objets dans la
      console.

  **/
  static debug(level, message, owner){
    if (this.isOff || (!level && !message) || level > this.maxLevel ) return this ;
    if ( owner && owner.refDebug ){
      message += `\n\t[${owner.refDebug}]`
    }
    this.log(level, message)

    // Écrire les données supplémentaires
    // [1] l'argument 'owner' est défini, mais ça n'est pas un propriétaire
    //     puisqu'il ne connait pas la méthode refDebug
    if ( owner && !owner.refDebug /* [1] */) {
      for(var k in owner){
        var valAff ;
        switch(typeof(owner[k])){
          case 'object': valAff = owner[k];break;
          default: valAff = String(owner[k])
        }
        this.log(level, `\t[${k}] = `, valAff)
      }
    }
    return this
  }


  static setMaxLevel(niv){
    this.oldMaxLevel = Number(Debug.maxLevel)
    this.maxLevel = niv
    this.oldOff = Boolean(this.off)
    this.isOn || this.start()
  }

  static unsetMaxLevel(){
    this.maxLevel = Number(this.oldMaxLevel)
    this._off = this.oldOff
  }

  static log(level, message, data){
    if ( data ) {
      console.log('%c'+message, `color:${this.COLOR_PER_LEVEL[level]};`, data)
    } else {
      console.log('%c'+message, `color:${this.COLOR_PER_LEVEL[level]};`)
    }
  }

  static start(){this._off = false}
  static on(){this._off = false}
  static stop() {this._off = true}
  static off(){this._off = true}

  static get isOff(){
    if (undefined === this._off) { this._off = false}
    return this._off
  }
  static get isOn(){return !this.isOff}

  static get COLOR_PER_LEVEL(){return this._colorperlevel || (
    this._colorperlevel = {
        1: '#1462e0'  // bleu
      , 2: '#6334d9'  // violet
      , 3: '#ab119b'  // mauve
      , 4: '#87233c'  // brun
      , 5: '#2c968f'  // bleu-vert
      , 6: '#38f23b'  // vert clair
      , 7: '#368c00'  // vert
      , 8: '#e6a525'  // orange
      , 9: '#c71f10'  // rouge
    }
  )}
}
const X = Debug.debug.bind(Debug)
