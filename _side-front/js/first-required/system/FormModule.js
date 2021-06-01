'use strict'
/**
  Un module de fonction à insérer dans toutes les constantes ou les classes
  qui ont besoin de travailler avec un formulaire.

  @usage

    const LaClasse = {

    }
    Object.assign(LaClasse, FormModule)

  REQUIS
  ======

    • La table recevant les données doit impérativement posséder les colonnes :

    id    Pour l'identifiant
    created_at    Pour la date de création de la donnée
    updated_at    Pour la date de modification de la donnée

    • La constante/class doit définir 'form' qui retourne l'HTMLElement du
      formulaire dans lequel on recherchera les champs.
      this.form = document.querySelector('#mon-formulaire')

    • La constante/class appelante doit définir :

    prefix      Le préfixe qui sera ajouté à chaque propriété, avec un tiret
                Par exemple, si prefix = 'projet' et que la propriété est 'id',
                le champ aura pour nom 'projet-id'
    table_name  Nom de la table dans la base de données de l'application.

    PROPERTIES  Liste array des propriétés, pour pouvoir toutes les relever.

    DATE_PROPERTIES Liste des propriétés date (les valeurs string seront
                transformées en dates pour l'enregistrement)

    INTEGER_PROPERTIES  Liste array des propriétés de type entier. À la relevée,
                les valeurs des propriétés de cette liste seront transformées en
                nombres entiers.
**/

const FormModule = {
  name: 'FormModule'

  /**
    Pour définir les valeurs dans le formulaire courant
  **/
, setFormValues(data){
    for (var prop of this.PROPERTIES){
      this.setFormValue(prop, data[prop])
    }
  }
, setFormValue(prop, value){
    var field = this.form.querySelector(`*[name="${this.prefix}-${prop}"]`)
    field || raise(`Le champ de name '${this.prefix}-${prop}' est introuvable…`)
    if ( this.DATE_PROPERTIES && this.DATE_PROPERTIES.includes(prop) ) {
      value = mmddyyyy(value)
    }
    field.value = value
  }

, getFormValues(){
    var values = {}
    for (var prop of this.PROPERTIES){
      Object.assign(values, {[prop]: this.getFormValue(prop)})
    }
    if ( this.DATE_PROPERTIES ) {
      for ( var prop of this.DATE_PROPERTIES ){
        values[prop] && (values[prop] = new Date(values[prop]))
      }
    }
    if ( this.INTEGER_PROPERTIES ) {
      for ( var prop of this.INTEGER_PROPERTIES){
        values[prop] && (values[prop] = parseInt(values[prop],10))
      }
    }
    return values
  }
  /**
    retourne la valeur de la propriété +prop+
  **/
, getFormValue(prop){
    let val = this.form.querySelector(`*[name="${this.prefix}-${prop}"]`).value.trim()
    if ( val === '' ) val = null
    return val
  }

}
