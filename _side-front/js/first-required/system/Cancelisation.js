'use strict';
/** ---------------------------------------------------------------------
    Class Cancelisation
    -------------------
    Gestion des annulations

# version 0.1.0

# 0.1.0
    Ajout du traitement avec {:object, :method, :args}
# 0.0.1
    Première mise en place

Pour créer une annulation :
    const cancel = new Cancelisation({eval:..., ou autre})
    flash("Le message" + cancel.link)

    Dans la table transmise à l'instanciation, on peut définir :
      {eval:'code'}      Un code à évaluer tel quel
      {object:<Classe|Instance>, method:Method, args: arguments}
        Une méthode de classe ou instance à jouer avec ou sans arguments sur
        la classe ou l'instance (object)

*** --------------------------------------------------------------------- */
class Cancelisation {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */
  static get(cancel_id){
    this.items || (this.items = new Map())
    return this.items.get(cancel_id)
  }

  static add(icancel){
    this.items || (this.items = new Map())
    this.items.set(icancel.id, icancel)
  }

  static newId(){
    this.lastId || ( this.lastId = 0 )
    return ++ this.lastId
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(data){
    this.data = data
    this.id = this.constructor.newId()
    this.constructor.add(this)
  }

  /**
    Méthode pour annuler
  **/
  cancel(){
    if (this.data.eval) {
      eval(this.data)
    } else if (this.data.object) {
      if (this.data.args){
        this.data.object[this.data.method].call(this.data.object, ...this.data.args)
      } else {
        this.data.object[this.data.method].call(this.data.object)
      }
    }
  }

  /**
    Retourne le lien permettant d'annuler l'action
  **/
  get link(){
    return DCreate('A',{class:'cancel-link', href:'#', onclick:`Cancelisation.get(${this.id}).cancel()`, inner:'Annuler'}).outerHTML
  }

}
