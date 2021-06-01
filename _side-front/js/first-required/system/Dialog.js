'use strict';
/**

  classe MDialog
  -------------
  version 2.1.4

  # version 2.1.4
      Possibilité d'ajouter une mainClass pour reconnaitre plus
      facilement le dialogue avec un selector.
  # version 2.1.3
      Focus et sélection du champ de saisie, if any
  # version 2.1.2
      Possibilité de définir rapidement 'prompt'
  # version 2.1.1
      Début de traitement avec les locales.
  # version 2.1.0
    + traitement spécial pour la méthode confirm
  # version 2.0.0
    - Abandon total de jQuery
    - Correction des bugs de fonctionnement

  Requis :
    - dialog.css pour la mise en forme
    - img/icons/dialog/ et son contenu pour les images d'icones
    - Locales.js (et la définition des locales dans
                  _site-front/app/locales/$LANG/data.yaml)

  Les options envoyés correspondent en gros aux options de la méthode
  Dialog.showMessageBoxSync
  (cf. le traitement particulier de la méthode 'confirm' ci-dessous, en [1])
  (cf. le traitement particulier de la méthode 'prompt' ci-dessous, en [2])

    :buttons        Liste des boutons, de la gauche à la droite
                    Note : contrairement au fonction de la méthode native, on
                    met les boutons dans l'ordre où ils apparaissent.
                    ATTENTION : pour la méthode prompt et ask, il faut une liste
                    de *données boutons*, des tables qui contiennent au minimum
                    :text (texte du bouton) et :onclick, méthode à appeler quand
                    on clique sur le bouton. Noter qu'elle peut être fournie de
                    deux façons : soit comme string qui sera collé dans l'attribut
                    onclick de la balise, soit comme fonction (meilleur) qui
                    servira à l'observation du bouton.
                    La réponse donnée sera mise en dernier argument (donc certainement le
                    premier) des méthodes d'observer définies. Noter que si c'est
                    un string qui est fourni, on devra utiliser un autre moyen,
                    pas encore défini, pour obtenir la réponse donnée.
    defaultId:      Index du bouton par défaut (par défaut le dernier)
                    Note : contrairement au fonctionnement de la méthode native,
                    on compte les index à partir de 1 et à partir de la gauche.
                    Dans ["Cancel", "OK"], "Cancel" aura l'index 1 et "OK" aura
                    l'index 2.
    cancelId:       Index du bouton d'annulation (par défaut le premier)
                    Même note que ci-dessus.
    defaultAnswer:  La réponse par défaut, si c'est une prompt.
    title:          Le titre de la boite de dialogue
    information:    Information supplémentaire (:detail, dans Dialog)
    checkbox:{:label, :checked} Pour ajouter une case à cocher
    icon:           Chemin d'accès à l'icône (if any)
    accessKeys:     true/false pour décider si on peut utiliser les touches
                    Le raccourci doit être ajouté au bout du bouton après une
                    esperluette. Par exemple : "Voir&v" permettra d'utiliser
                    CMD+V (Ctrl+v sur pc) pour activer le bouton.

    RETURN l'index du bouton choisi, 1-start à partir de la gauche (contraire-
    ment au fonctionnement de la méthode native).

  [1] Traitement spécial de la méthode confirm
    Pour la méthode `confirm` qui demande une confirmation, on peut se
    contenter d'envoyer la question et la méthode qui doit traiter le retour.
    Par exemple : confirm("Êtes-vous d'accord ?", my.traiteAccord.bind(my))
    La méthode de retour reçoit un unique argument qui est TRUE quand on a
    cliqué sur le bouton 'oui' et FALSE quand on a cliqué sur 'non'
    function traiteAccord(oui){
      if ( oui ) {
        console.log("Vous êtes d'accord")
      } else {
        console.log("Vous n'êtes pas d'accord")
      }
    }
  [2] Traitement spécial de la méthode prompt
    On peut l'appeler en ne définissant que :
      prompt(question, {
          defaultAnswer:  "Valeur par défaut"
        , returnMethod:   La méthode de retour, qui doit accepter 1 seul
                          argument : la valeur entrée par l'utilisateur ou null
                          s'il a renoncé ou qu'elle est vide.

      })
  TODO
    - pour les prompt et ask, tenir compte des boutons par défaut aussi bien
      au niveau de l'aspect (btn-primary) qu'au niveau du fonctionnement (la
      touche ENTER doit permettre de l'activer). Idem pour cancel : la touche
      ESCAPE doit permettre de l'activer.

**/
function alert(msg, options){return MDialog.alert(msg, options)}
function notice(msg, options){return MDialog.notice(msg, options)}
function prompt(msg, options){return MDialog.prompt(msg,options)}
function ask(msg, options){return MDialog.ask(msg,options)}
function confirm(msg,options){return MDialog.confirm(msg,options)}

const NodeJSDialog = require('electron').remote.dialog

class MDialog {
  static alert(msg, options){
    options = options || {}
    Object.assign(options, {type: 'alert'})
    return (new MDialog(msg,options)).show()
  }
  static notice(msg, options){
    options = options || {}
    Object.assign(options, {type: 'notice'})
    return (new MDialog(msg,options)).show()
  }

  /**
    Attention : pour ask et prompt, on utilise tout à fait
    autre chose.
  **/
  static prompt(msg, options){
    options = options || {}
    if(undefined === options.defaultId) options.defaultId = 2;
    if(undefined === options.cancelId)  options.cancelId = 1;
    Object.assign(options, {type: 'prompt'})
    const dialog = new HTMLDialog(msg, options)
    if (options.returnMethod){
      dialog.options.buttons = [
        {text:loc('word.cancel'), onclick:dialog.onClickCancel.bind(dialog), index:1}
      , {text:loc('word.ok'), onclick:dialog.onClickOK.bind(dialog), index:2}
      ]
    }
    return dialog.show()
  }
  static ask(msg, options){
    options = options || {}
    Object.assign(options, {type: 'ask'})
    options.buttons || raise("Il faut définir les boutons, avec la méthode 'ask' !")
    return (new HTMLDialog(msg,options)).show()
  }
  static confirm(msg,options){
    options || raise(loc('error.dialog.confirm.options.required'))
    const definedWithFunction = options instanceof Function
    definedWithFunction && ( options = { returnMethod: options } )
    if(undefined === options.defaultId) options.defaultId = 2;
    if(undefined === options.cancelId)  options.cancelId = 1;
    Object.assign(options,{type:'confirm'})
    const dialog  = new HTMLDialog(msg,options)
    if ( definedWithFunction ) {
      dialog.options.buttons = [
          {text:loc('word.no'),   onclick:dialog.onClickNo.bind(dialog), index:1}
        , {text:loc('word.yes'),  onclick:dialog.onClickYes.bind(dialog), index:2}
      ]
    }
    dialog.show()
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE MDialog
    *
  *** --------------------------------------------------------------------- */

  constructor(msg, options){
    this.message = msg
    this.options = options
  }
  // Ouvre le fenêtre
  show(){
    let params = {
        type:       this.dialType
      , title:      this.options.title
      , buttons:    this.buttonsList
      , defaultId:  this.defaultButtonId
      , cancelId:   this.defaultCancelId
      , message:    this.message
      , detail:     this.options.information
      , icon:       this.options.icon
      , normalizeAccessKeys:  this.options.accessKeys || false
      , defaultAnswer:        this.defaultAnswer || ''
    }
    // Case à cocher
    this.options.checkbox && Object.assign(params, {checkboxLabel:this.options.checkbox.label, checkboxChecked:this.options.checkbox.checked})

    // console.log("params:",params)
    let res = NodeJSDialog.showMessageBoxSync(params)
    return this.nbButtons - res
  }

  get buttonsList(){
    if (undefined === this._buttonslist){
      if ( undefined === this.options.buttons ){
        this._buttonslist = [loc('word.OK'),loc('word.Renounce')]
      } else {
        this._buttonslist = this.options.buttons.reverse()
      }
    }
    // console.log("this._buttonslist = ", this._buttonslist)
    return this._buttonslist
  }
  get defaultButtonId(){
    if (undefined === this._defbtnid){
      if ( undefined === this.options.defaultId){
        this._defbtnid = 0
      } else {
        this._defbtnid = this.nbButtons - this.options.defaultId
      }
    }
    return this._defbtnid
  }
  get defaultCancelId(){
    if (undefined === this._defcancelid){
      if ( undefined === this.options.cancelId ) {
        this._defcancelid = this.nbButtons - 1
      } else {

        this._defcancelid = this.nbButtons - (this.options.cancelId)
      }
    }
    return this._defcancelid
  }
  get nbButtons(){return this.buttonsList.length}

  get TYPE2DIALTYPE(){return {'ask':'question', 'prompt':'question', '':'none', 'notice':'info', 'alert':'warning', 'confirm':'none'}}

  get dialType(){
    if (undefined === this._dialtype){
      this._dialtype = this.TYPE2DIALTYPE[this.options.type]
    }
    return this._dialtype
  }
}// class MDialog



class HTMLDialog extends MDialog {
  constructor(msg, options){
    super(msg.replace(/\n/g,'<br>'), options)
    this.numeroterButtons()
  }
  show(){
    this.build()
    this.observe()
  }
  remove(){
    this.unobserve()
    this.obj && this.obj.remove()
  }
  // Observation des boutons
  observe(){
    const my = this
    // Observation des boutons
    this.options.buttons.forEach( hbutton => {
      hbutton.onclick || raise("Il faut absolument définir tous les 'onclick' des boutons d'une boite de dialogue.")
      if ( hbutton.onclick instanceof Function ) {
        const btnId = `button#btn-${hbutton.index}`
        const btn = DGet(btnId,this.obj)
        if ( btn ) {
          btn.addEventListener('click', (ev)=>{hbutton.onclick.call(null, my.reponse)})
        } else {
          console.error("Bizarrement, impossible de trouver le bouton '%s' dans", btnId, this.obj)
        }
        // Chaque bouton doivent détruire la fenêtre de dialogue
        btn.addEventListener('click', my.remove.bind(my))
      }
    })

    // Dans tous les cas on observe les pressions de touche (up), mais ils
    // ne servent en réalité que pour le bouton principal et d'annulation
    // Ne fonctionne pas :
    // window.addEventListener('keyup', my.onKeyUp.bind(my))
    window.onkeyup = my.onKeyUp.bind(my)

    if ( this.reponseField ) {
      this.options.defaultAnswer && ( this.reponseField.value = this.options.defaultAnswer )
      this.reponseField.focus()
      this.reponseField.select()
    }
  }

  get mainButton(){
    return this._mainbutton || (this._mainbutton = DGet('button.main',this.obj))
  }
  get cancelButton(){
    return this._cancelbutton || (this._cancelbutton = DGet('button.cancel', this.obj))
  }

  /**
    Méthode appelée par le bouton principal (main) et le bouton
    annulation (cancel)
  **/
  onKeyUp(ev){
    ev && stopEvent(ev)
    if ( ev.key == 'Enter') {
      this.mainButton && this.mainButton.click()
    } else if (ev.key == 'Escape') {
      this.cancelButton && this.cancelButton.click()
    }
    return false
  }

  unobserve(){
    const my = this
    // S'il y a un bouton principal (main), il doit réagir à la touche
    // entrée. S'il y a un bouton cancel aussi
    // Ne fonctionne pas :
    // window.removeEventListener('keyup', my.onKeyUp.bind(my))
    window.onkeyup = null
  }

  numeroterButtons(){
    if (undefined === this.options.buttons ) return ;
    var ibtn = 0 ;
    this.options.buttons.forEach(dbtn => Object.assign(dbtn, {index: ++ibtn}))
  }

  // Construction de la boite de dialogue
  build(){
    const my = this
    let opts = this.options
    // Valeurs par défaut
    opts.buttons || Object.assign(opts,{buttons:[{index:1, text:'OK', onclick:`UI.onClickOk.call(UI,'${this.dialogId}')`}]})
    opts.title   || Object.assign(opts,{title: `Message de Proximit`})
    opts.icon    || Object.assign(opts, {icon: 'question.png'})
    // On définit le bouton principal
    var dbtn = opts.buttons[(opts.defaultId||options.buttons.length)-1]
    dbtn && Object.assign(dbtn, {main:true})
    if (opts.cancelId && opts.buttons[opts.cancelId]){
      Object.assign(opts.buttons[opts.cancelId-1], {cancel:true})
    }
    // On construit la boite
    var divInner = [
        DCreate('DIV',{class:'title', text:opts.title})
      , DCreate('IMG',{src:`img/icons/dialog/${opts.icon}`, class:'icon'})
      , DCreate('DIV',{class:'message',text:this.message})
    ]
    if ( false === (this.type == 'confirm') ){
      divInner.push(DCreate('INPUT',{type:'text',id:`reponse-${this.dialogId}`}))
    }
    var cssClasses = ['dialog']
    opts.mainClass && cssClasses.push(opts.mainClass)
    var div = DCreate('DIV',{class:cssClasses.join(' '), id:this.dialogId, inner:divInner})
    var divBtns = DCreate('DIV',{class:'buttons'})
    // Création des boutons
    opts.buttons.forEach(dbutton=>{
      dbutton.id = `btn-${dbutton.index}`
      dbutton.main    && (dbutton.class = 'main')
      dbutton.cancel  && (dbutton.class = 'cancel')
      const realDataButton = Object.assign({},dbutton)
      if ( dbutton.onclick instanceof Function ) {
        delete realDataButton.onclick
      }
      divBtns.append(DCreate('BUTTON', realDataButton))
    })
    div.append(divBtns)
    document.body.append(div)
  }

  /**
    4 méthodes à utiliser avec returnMethod (version simplifiée des
    méthodes prompt et confirm)
  **/
  onClickNo(){
    this.options.returnMethod.call(null,false)
  }
  onClickYes(){
    this.options.returnMethod.call(null,true)
  }
  onClickCancel(){
    this.options.returnMethod.call(null,null)
  }
  onClickOK(){
    var returnedValue = this.type == 'prompt' ? this.reponse : true
    if ( returnedValue === '' ) returnedValue = null
    this.options.returnMethod.call(null, returnedValue)
  }

  get reponse(){
    return this.reponseField && this.reponseField.value
  }
  get reponseField(){
    return this.obj && DGet(`input#reponse-${this.dialogId}`, this.obj)
  }
  get obj(){return DGet(`#${this.dialogId}`)}
  get dialogId(){
    return this._dialogid || (this._dialogid = `dialog-${Number(new Date())}`)
  }

  get type(){return this.options.type}
}
