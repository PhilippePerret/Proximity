'use strict'
/**
  |
  | Prefs.js
  | version 1.0.0
  |
  | Note : pour les valeurs propres à l'application courante, voir
  | le fichier then-required/app/preferences.js
**/

const Prefs = {

  /**
    retourne la préférence d'identifiant +pref_id+ ou sa valeur par défaut
  **/
  get(pref_id) {
    return this.data[pref_id] || eval(this.app_data[pref_id])
  }

  /**
    Définit une préférence
  **/
, set(prefId, value) {
    Object.assign(this.data, {[prefId]: value})
    this.save.call(this)
  }

  /**
    Charge les préférences (à mettre dans la procédure d'initialisation)
  **/
, load(){
    if ( fs.existsSync(this.path) ) {
      this.data = require(this.path)
    } else {
      log.debug("Le fichier '%s' n'existe pas, je ne peux pas le charger", this.path)
      this.data = {}
    }
    log.debug("Prefs.data = ", this.data)
  }


  /**
    Enregistrement du fichier des préférences de l'application
  **/
, save(){
    this.app_data || raise("Il est impératif de définir le Prefs.data_keys propre à l'application.")
    for (var k in this.app_data){
      var v = eval(this.app_data[k])
      Object.assign(this.data, {[k]: v})
    }
    fs.writeFileSync(this.path, JSON.stringify(this.data))
  }


}
Object.defineProperties(Prefs,{
  path:{get(){
    return path.join(app.getPath('userData'), 'preferences.json')
  }}
})
