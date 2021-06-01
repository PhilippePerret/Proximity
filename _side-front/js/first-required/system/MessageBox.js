'use strict'
/**
  Pour afficher une boite de dialogue avec des boutons

  ---------------
   Version 1.0.0
  ---------------

  USAGE
    let mb = new MessageBox(<data>)
    mb.show()
    //' Le programme doit se finir ici

  REQUIS :
    <data> définissant :
      :message      Le message principal à afficher
  OPTIONNEL
      :id           Identifiant (qui doit être unique) de la fenêtre à afficher
      :buttons      Liste Array des boutons, dans le même ordre qu'à l'écran
                    Par défaut : ['Annuler', 'OK']
      :title        Le titre de la fenêtre
                    Par défaut : vide
      :defaultButtonIndex   L'index du bouton (dans :buttons) sélectionné par
                            défaut. C'est lui qui réagira à la touche Return
                            Par défaut : 1
      :cancelButtonIndex    Index (dans :buttons) du bouton pour annuler. C'est
                            lui qui réagira à la touche Escape.
                            Par défaut : 0
      :okButtonIndex        Index (dans :buttons) du bouton pour confirmer. C'est
                            lui qui réagira (aussi) à la touche Return.
                            Par défaut : 1
      :methodOnOK           Méthode qui sera appelée si OK est cliqué (ou Return)
      :methodOnCancel       Méthode à appeler si le bouton Cancel est cliqué (ou
                            la touche Escape)
                            Note : si aucun de ces deux fonctions n'est définie,
                            c'est un simple message d'avertissement, avec un
                            bouton OK.
      :defaultAnswer        Si défini, ce n'est pas une boite de confirmation ou
                            d'information, c'est un prompt qui demander une
                            réponse à donner dans un champ de texte.
      :width                Largeur précise (ou en pourcentage) à donner à la
                            fenêtre.
                            Par défaut : 20%

**/
class MessageBox {
  constructor(data){
    this.data       = data
    this.id         = data.id || `mbox${Number(new Date())}${Math.rand(1000)}`
    this.title      = data.title || data.titre
    this.type       = data.type || 'alert' // 'alert', 'confirm' // inusité
    this.width      = data.width
    this.message    = data.message.replace(/\n/g,'<br>')
    this.defaultButtonIndex = data.defaultButtonIndex
    if(undefined === this.defaultButtonIndex){
      this.defaultButtonIndex = 1
    }
    this.cancelButtonIndex = data.cancelButtonIndex || 0
    this.okButtonIndex     = data.okButtonIndex
    if (undefined === this.okButtonIndex){
      this.okButtonIndex = 1
    }
    this.defaultAnswer = data.defaultAnswer

    this.methodOnCancel = data.methodOnCancel
    this.methodOnOK     = data.methodOnOK || data.methodOnOk

    this.buttons    = data.buttons || ['Annuler', 'OK']

  }
  show(){
    this.build()
    this.observe()
  }
  close(){
    this.remove()
    this.unobserve()
  }
  unobserve(){
    // Remettre les observers originaux
    window.onkeyup = this.oldKeyUp
    window.onkeydown = this.oldKeyDown
  }
  remove(){
    this.obj.remove()
  }
  get isConfirmBox(){return this.type === 'confirm'}

  onClickBtn(ibtn){
    // F.notify(`Bouton cliqué : ${ibtn}`)
    this.close()
  }

  // Quand on annule avec la touche ESCAPE ou le bouton d'annulation
  onCancel(e){
    // F.notify("Bouton CANCEL cliqué")
    isDefined(this.methodOnCancel) && this.methodOnCancel.call()
    this.close()
  }

  onOK(e){
    // F.notify("Bouton OK cliqué -- ou Return")
    if ( this.isPrompt() ) {
      this.methodOnOK(this.getAnswer(), 1)
    } else {
      isDefined(this.methodOnOK) && this.methodOnOK.call()
    }
    this.close()
  }

isPrompt(){return isDefined(this.defaultAnswer)}

// Quand on relève une touche dans la réponse
onKeyUpAnswer(e){
  e.stopPropagation(e)
  switch (e.key) {
    case 'Enter':
      if ( this.okButtonIndex === this.defaultButtonIndex) {
        this.onOK(e)
      } else if (this.cancelButtonIndex === this.defaultButtonIndex) {
        this.onCancel(e)
      }
      return false
    case 'Escape':
      return stopEvent(e)
    case 'Tab':
      e.stopPropagation()
      this.onCancel(e)
      return false
    default:
      e.stopPropagation()
      return true
  }
}
onKeyDownAnswer(e){
  e.stopPropagation()
  return true
}

/**
  Retourne la valeur donnée dans le champ, si c'est un prompt
**/
getAnswer(){
  return this.answerField.value.trim()
}

build(){
  var ibtn = -1 // pour commencer à 0
  var btns = this.buttons.map( b => DCreate('BUTTON', {type:
    'button', inner:b, class:`button-${++ibtn}`}))
  // $(btns[this.defaultButtonIndex]).addClass('main-button')
  btns[this.defaultButtonIndex].classList.add('main-button')

  var divs = [
      DCreate('DIV',{class:'title', inner: this.title})
    , DCreate('DIV',{class:'message', inner: this.message})
  ]
  if ( this.isPrompt() ) {
    divs.push(DCreate('DIV',{class:'reponse',append:[
      DCreate('INPUT',{type:'text',class:'message-box-answer',value:this.defaultAnswer})
    ]}))
  }
  // Ajout des boutons
  divs.push(DCreate('DIV',{class:'buttons', append:btns}))

  this.obj = DCreate('DIV',{id:this.id, class:`message-box message-box-${this.type}`, append:divs})
  // this.jqObj = $(obj)
  if ( isDefined(this.width) ) {
    this.obj.style.width = this.width
    // Régler aussi la marge (mais seulement si la taille est donnée en %)
    if ( this.width.endsWith('%') ){
      let pct = parseInt(this.width.substring(0, this.width.length - 1), 10)
        , reste = Math.round((100 - pct) / 2)
      this.obj.style.left = `${reste}%`
    }
  }
  document.body.appendChild(this.obj)
}

observe(){
  for(var ibtn = 0, len = this.buttons.length; ibtn < len ; ++ibtn){
    // ibtn = parseInt(ibtn,10)
    if ( ibtn == this.okButtonIndex ){
      this.obj.querySelector(`.button-${ibtn}`).addEventListener('click', this.onOK.bind(this))
    } else if ( ibtn == this.cancelButtonIndex ){
      this.obj.querySelector(`.button-${ibtn}`).addEventListener('click', this.onCancel.bind(this))
    } else {
      // Autres boutons
      this.obj.querySelector(`.button-${ibtn}`).addEventListener('click', this.onClickBtn.bind(this, parseInt(ibtn,10)))
    }
  }

  // On bloque toutes les autres actions
  this.oldKeyUp     = window.onkeyup
  this.oldKeyDown   = window.onkeydown

  window.onkeyup    = this.onKeyUp.bind(this)
  window.onkeydown  = this.onKeyDown.bind(this)

  // On focusse dans le champ de saisie, si c'est un prompt
  if ( this.isPrompt() ){
    this.answerField.addEventListener('keyup', this.onKeyUpAnswer.bind(this))
    this.answerField.addEventListener('keydown', this.onKeyDownAnswer.bind(this))
    // this.answerField.addEventListener('focus', UI.onFocusTextField.bind(UI))
    // this.answerField.addEventListener('blur',  UI.onBlurTextField.bind(UI))
    this.answerField.focus()

    // UI.onFocusTextField.bind(UI)({target: this.answerField[0]}/* ne sert à rien pour le moment*/)
  }
}

  onKeyUp(e)    {
    if(e.key === 'Escape') this.onCancel()
    else if (e.key === 'Enter'){
      if ( this.okButtonIndex === this.defaultButtonIndex) {
        this.onOK(e)
      } else if (this.cancelButtonIndex === this.defaultButtonIndex) {
        this.onCancel(e)
      }
    }
    return stopEvent(e)
  }
  onKeyDown(e)  { return stopEvent(e) }
  onClickBackground(e){
    return stopEvent(e)
  }

get answerField(){return document.querySelector('.reponse input[type="text"]')}

}// /class MessageBox

module.exports = MessageBox
