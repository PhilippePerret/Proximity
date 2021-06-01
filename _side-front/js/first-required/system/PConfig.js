'use strict'
/** ---------------------------------------------------------------------
  *   Class PConfig
  *   Gestion d'un fichier de configuration

  Version 0.1.0
  -------------

  # Version 0.1.0
      Première installation.

REQUIS
------
  Le `owner` servant à l'instanciation doit définir la propriété `configPath`,
  qui retourne le chemin d'accès au fichier de configuration.
  - Flash.js
  - Dialog.js

FONCTIONNEMENT
--------------
  Les données de configuration doivent être définies par :

const APP_DATA_CONFIG = {
  <id config>:{
      hname: "<nom humain de la configuration>"
    , type:  "<type>" // 'string', 'long-string', 'boolean', 'number', 'select'
    , value: "<valeur par défaut>"
    , values: [[val,tit], [val,tit], [val,tit]] // pour un select
    , placeholder: "<placeholder>"
  }
}

L'objet propriétaire peut définir la méthode `onChangeConfig` pour
faire des opérations après la sauvegarde des données. Noter que cette
méthode n'est appelée que si une donnée configuration au moins a vraiment été
modifiée. La table des données de configuration modifiée (et seulement les
valeurs modifiées) est envoyée en premier argument de owner.onChangeConfig.

*** --------------------------------------------------------------------- */
class PConfig {

  constructor(owner){
    this.owner = owner
  }

  /**
    Retourne la configuration d'identifiant +configId+
  **/
  get(configId){
    return defaultize(this.data, configId, this.defaultValueOf(configId))
  }

  defaultValueOf(configId){
    return APP_DATA_CONFIG[configId].value
  }
  /**
    Définit une configuration (et l'enregistre tout de suite)
  **/
  set(configId, value) {
    if ( this.get(configId) != value ) {
      Object.assign(this.data, {[configId]: value})
      this.save({[configId]: value})
    }
  }

  load(){
    return fs.existsSync(this.path)
      ? JSON.parse(fs.readFileSync(this.path,'utf8'))
      : {}
  }

  /**
    Pour sauver les configurations et les enregistrer
    Cette méthode est appelée par le bouton "Enregsitrer" de la fenêtre des
    configurations
  **/
  saveAndClose(){
    // On conserve les valeurs initiales pour voir s'il y a changement
    const initValues = Object.assign({}, this.data)
    this.getFormValues()
    // console.log("Valeurs de config à sauver : ", this.data)
    // On vérifie s'il y a vraiment eu des changements
    var changedValues = {}
    for(var k in this.data) {
      if (this.data[k] != initValues[k]) {
        Object.assign(changedValues, {[k]: this.data[k]})
      }
    }
    if ( Object.keys(changedValues).length ) {
      this.save(changedValues)
      flash("Nouvelles valeurs de configuration prises en compte.")
    }
    this.hide()
  }
  /**
    Enregistrement des configurations

    ATTENTION ! changedValues ne contient pas les valeurs à enregistrer,
    mais seulement le hash des valeurs qui ont été modifiées (pour envoi
    à onChangeConfig du propriétaire).
    Dans tous les cas, l'intégralité des données de configuration sont
    enregistrées.
  **/
  save(changedValues){
    fs.writeFile(this.path, JSON.stringify(this.data), err => {
      if ( err ) App.onError(err)
      else {
        Log.write('[Config]', '', "- Configuration sauvée -")
        if ( this.owner.onChangeConfig instanceof Function ){
          this.owner.onChangeConfig.call(this.owner, changedValues)
        }
      }
    })
  }

  /**
    Bascule d'affichage/masquage de la fenêtre des configurations
  **/
  toggle(){
    if (!this.built || this.window.classList.contains('noDisplay')){
      this.edit()
    } else {
      this.hide()
    }
  }
  /**
    Mettre les configurations en édition
  **/
  edit(){
    ;(this.built && this.window) || this.buildWindow()
    this.show()
  }

  /**
    Afficher la fenêtre des configurations
  **/
  show(){
    this.window.classList.remove('noDisplay')
  }
  /**
    Masquer la fenêtre des configurations
  **/
  hide(){
    this.window.classList.add('noDisplay')
  }

  /**
    Méthode appelée par le bouton "Enregistrer" du panneau des configurations,
    pour relever toutes les valeurs et les enregistrer.
  **/
  getFormValues(){
    for(var configId in APP_DATA_CONFIG){
      var dataConfig = APP_DATA_CONFIG[configId]
      var value = ((id, data)=>{
        var field = DGet(`#config-${id}-value`)
        switch(data.type){
          case 'string':
          case 'long-string':
            return field.value
          case 'number':
            return parseInt(field.value,10)
          case 'boolean':
            return field.value == 'true'
          default:
            // select par exemple
            return field.value
        }
      })(configId, dataConfig)
      Object.assign(this.data, {[configId]: value})
    } // fin de boucle sur toutes les valeurs
  }

  /**
    Construction de la fenêtre d'édition
  **/
  buildWindow(){
    if ( DGet('#configurations') ) return
    // Les parties complètes de la configuration
    var divs = []
    // Les lignes de configuration
    var confLines = []
    for(var configId in APP_DATA_CONFIG){
      var dataConfig = APP_DATA_CONFIG[configId]
      // Définition du champ d'édition en fonction du type de la donnée
      var dataField = ((dataConfig, configId, value)=>{
        let type = dataConfig.type
        let fieldId = `config-${configId}-value`
        let attrsText = {id:fieldId, type:'text', placeholder:dataConfig.placeholder, value:value}
        switch(type){
          case 'boolean':
            return DCreate('SELECT',{id:fieldId, inner:[
                DCreate('OPTION', {value:'true', inner:'true'})
              , DCreate('OPTION', {value:'false', inner:'false'})
            ]})
          case 'number':
            return DCreate('INPUT', Object.assign(attrsText, {class:'short'}))
          case 'long-string':
            return DCreate('INPUT', Object.assign(attrsText, {class:'long-string'}))
          case 'select':
            var options = []
            for (var doption of dataConfig.values){
              var attrs = {value:doption[0], inner:doption[1]}
              if ( doption[0] == value ) Object.assign(attrs,{selected:true})
              options.push(DCreate('OPTION', attrs))
            }
            return DCreate('SELECT', {id:fieldId, inner:options})
          default:
            return DCreate('INPUT', Object.assign(attrsText, {class:null}))
        }
      })(dataConfig, configId, this.get(configId))
      confLines.push(DCreate('DIV',{class:'config-line',inner:[
          DCreate('LABEL', {text: dataConfig.hname})
        , dataField
        , DCreate('SPAN', {inner:[
            DCreate('BUTTON', {type:'button', class:'btn-defvalue', 'data-id':configId, text: 'default'})
          , DCreate('BUTTON', {type:'button', class:'btn-help', 'data-id':configId, text:'💡'})
        ]})
      ]}))
    }
    // Ajouter chaque configuration
    divs.push(DCreate('DIV',{id:'config-lines', inner:confLines}))

    // Les boutons
    divs.push(DCreate('DIV',{id:'config-buttons', class:'buttons', inner:[
        DCreate('BUTTON', {id:'btn-config-close', type:'button', text:'Fermer'})
      , DCreate('BUTTON', {id:'btn-config-defvalues', type:'button', text:'Valeurs par défaut'})
      , DCreate('BUTTON', {id:'btn-config-save', type:'button', text:'Enregistrer'})
    ]}))

    document.body.appendChild(
      DCreate('DIV',{id:'configurations',inner:divs})
    )
    this.observe()
    this.built = true
  }

  /**
    Méthode qui remet toutes les valeurs par défaut
  **/
  setAllDefaultValues(){
    for(var configId in APP_DATA_CONFIG){
      var value = this.defaultValueOf(configId)
      value = value ? String(value) : ''
      DGet(`#config-${configId}-value`).value = value
    }
  }

  /**
    Remet la valeur par défaut dans la fenêtre de configuration pour
    le bouton +btn+ (qui contient dans son attribut 'data-id' l'id de la
    configuration)
  **/
  setDefaultValueFor(btn){
    const configId = btn.getAttribute('data-id')
    DGet(`#config-${configId}-value`).value = this.defaultValueOf(configId)
  }

  /**
    Observation de la fenêtre de configuration
  **/
  observe(){
    // Observation des boutons d'aide
    DGetAll('.btn-help',this.window).forEach(btn=>MiniAide.observeButton(btn))
    // Observation des boutons de valeur par défaut (individuel)
    DGetAll('.btn-defvalue',this.window).forEach(btn=>{
      btn.addEventListener('click',this.setDefaultValueFor.bind(this,btn))
    })
    // Observation du bouton qui remet toutes les valeurs par défaut
    DGet('#btn-config-defvalues').addEventListener('click',this.setAllDefaultValues.bind(this))
    // Observation du bouton pour enregistrer
    DGet('#btn-config-save', this.window).addEventListener('click', this.saveAndClose.bind(this))
    // Observation du bouton pour fermer la fenêtre (sans rien faire)
    DGet('#btn-config-close',this.window).addEventListener('click', this.hide.bind(this))
  }

  /**
    Les données enregistrées
  **/
  get data(){
    if ( undefined === this._data ) {
      this._data = this.load()
    } return this._data
  }

  /**
    La fenêtre (DIV) d'édition des configurations
  **/
  get window(){
    return this._window || (this._window = DGet('#configurations'))
  }
  /**
    Chemin d'accès au fichier de configuration
  **/
  get path(){
    return this.owner.configPath

  }

}
