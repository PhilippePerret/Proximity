'use strict'
/**
  Constante UI
  version 1.5.1
  ------------

  Requis :
    - UI.css
    - img/divers/waiter-rond-bleu.gif

  # version 1.5.1
    * Ajout des dimensions de l'interface (UI_HEIGHT et UI_WIDTH)

  # version 1.5.0
    * "Isolation" du waiter, pour le faire apparaitre au milieu de la page
      pas dans un container.

  # version 1.4.2
    * Correction des arguments de UI.message, pour pouvoir mettre des options
      et pas seulement un style.

  # version 1.4.1
    * UI.error retourne false (pour pouvoir faire 'return UI.error("...")')
    * On peut utiliser des retours chariots dans les messages ("\n")

  # version 1.4.0
    * Possibilité d'envoyer des options à la méthode 'rend_visible' pour
      affiner les possibilité. 1. déterminer l'écartement avec le haut,
      2. empêcher le déplacement 'smooth' pour placer deux éléments dans la
      page

  # version 1.3.1
    * Option 'waiter' pour ajouter le "waiter" au bout d'un message.
    * Option 'replace' pour remplacer le message précédent
    * Amélioration de la gestion des messages

  # version 1.3.0
    Méthode `waiter` pour mettre un waiter d'attente sur la page

  # version 1.2.0
    Méthode 'select' qui permet de sélectionner tout élément, même
    un champ editableContent (donc autre que input-text ou textarea qui se
    sélectionnent simplement avec la méthode 'select')

  # version 1.1.2
    Correction du bug qui générait une erreur lorsqu'un message était
    demandé alors que le dernier flash n'était pas encore supprimé.

  # version 1.1.1
    Suppression de tout ce qui concernait l'application 'Projet'

  # version 1.1.0
    Ajout de UI.flash qui permet d'afficher des messages.

  # version 1.0.1
    Ajout de la méthode UI.message et de l'objet UI.footerMessage
    Pour afficher des messages en bas de page.
**/

const HORLOGE_ATTENTE = '<img class="waiter" src="img/divers/waiter-rond-bleu.gif" />'

const UI = {

  // Pour écrire un message dans le pied de page
  message(msg, options){
    if ( 'string' === typeof options) options = {style: options}
    else if ( undefined === options ) options = {}
    options.style || Object.assign(options, {style:'neutre'})
    this.flash(msg, options)
    return true
  }
, error(msg, options){
    options = options || {}
    options.style = 'warning'
    this.flash(msg, options)
    return false
  }

  /**
    Affiche un message
    @param {String} msg   Le message à afficher
    @param {Hash|String}  options   Les options ou le style
                          keep:     Si true, on ne fait pas disparaitre le message
                          style:    Le style, 'notice', 'neutre' ou 'warning'
                          replace:  Si true, le texte précédente est effacé et
                                    remplacé par celui-là
                          waiter:   Si true, un "waiter" est placé devant le message
  **/
, flash(msg, options){
    const my = this
    if ( 'string' === typeof options ) options = {style:options}
    else { options = options || {} }
    if ( options.waiter ) msg = `${HORLOGE_ATTENTE} ${msg}`
    // Si un timer de destruction est en route, il faut l'interrompre
    my.flashTimer && this.clearFlashTimer()
    let divFlash = document.querySelector('#flash')
    if ( options.replace && divFlash ){
      divFlash.remove()
      divFlash = undefined
    }
    divFlash || (divFlash = DCreate('DIV',{id:'flash'}))
    msg = msg.replace(/\n/g,'<br>')
    let divMsg   = DCreate('DIV',{class:options.style||'notice', text:msg})
    divFlash.append(divMsg)
    document.body.append(divFlash)
    // Sauf si l'option 'keep' est activée, il faudra supprimer le message
    // au bout d'un certain temps
    if ( !options.keep ) {
      let nombre_mots = msg.split(' ').length
      if ( nombre_mots < 6 ) nombre_mots = 6
      let laps = 1000 * ( nombre_mots / 1.5 )
      my.flashTimer = setTimeout(()=>{
        let flash = document.querySelector('#flash')
        flash.classList.add('vanish')
        my.clearFlashTimer()
        my.flashTimer = setTimeout(()=>{
          my.clearFlashTimer()
          flash.remove()
        }, laps + 5000)
      }, laps)
    }
  }

, clearFlashTimer(){
    const my = this
    clearTimeout(my.flashTimer)
    my.flashTimer = null
    document.querySelector('#flash').classList.remove('vanish')
    my.errorAlreadySignaled = false
  }

, HORLOGE_WAITER: '<img class="waiter" src="img/divers/waiter-droit.svg" />'
, waiter(msg) {
    if ( DGet('#waiter') ) this.stopWaiter()
    let divWaiter = DCreate('DIV',{id:'waiter'})
    msg = (msg||'').replace(/\r?\n/g,'<br>')
    if ( msg ) divWaiter.append(DCreate('DIV',{text:msg}))
    divWaiter.append(DCreate('DIV',{text:this.HORLOGE_WAITER}))
    document.body.appendChild(divWaiter)
    return new Promise((ok,ko)=>{setTimeout(ok,200)})
  }
, stopWaiter(){
    DGet('#waiter') && DGet('#waiter').remove()
  }

, init(){
    if ('function' == typeof(this.build)) this.build.call(this)
    this.observe()

  }

, setDimensions(){
    const my = this
        , hwindow = window.innerHeight
        , hheader = UI.header.offsetHeight
        , hfooter = UI.footer.offsetHeight
        , innerHeight = `${hwindow - (hheader + hfooter)}px`
  }

, observe(){
    if ( this.observeApp ) this.observeApp.call(this)
  }

  /**
    Sélection l'élément DOM element quel qu'il soit.
  **/
, select(element){
    var range = new Range()
    range.setStart(element,0)
    range.setEnd(element,1) // TODO Si l'élément contient des noeuds, il faudra
                            // s'y prendre autrement, car là, seul le premier
                            // noeud sera pris en considération
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(range)
  }
  /**
    Rend visible l'élément +o+ {HTMLElement} dans son parent

    @param {Hash} options   Permet de définir des valeurs fixes.
                            fromTop:  Si défini, détermine l'écart depuis le
                                      haut de l'élément. Par défaut, c'est un
                                      tiers si on descend et deux tiers si on
                                      monte.
                            :smooth   Si false, on se rend directement à l'objet
                                      sans animation douce. Sert en général pour
                                      placer deux éléments, le premier devant se
                                      placer immédiatement à sa place pour ré-a-
                                      juster avec le second.
  **/
, rendVisible(o, options) {
    options = options || {}

    let parent = o.parentNode

    let pBounds = parent.getBoundingClientRect()
      , parentStyle = window.getComputedStyle(parent)
      , oneTiers = pBounds.height / 3
      , twoTiers = 2 * oneTiers

    var h = {
          pBounds: pBounds
        , pHeight: pBounds.height
        , pBorderTop: parseInt(parentStyle['borderTopWidth'],10)
        , pPaddingTop: parseInt(parentStyle['paddingTop'],10)
        , oneTiers: oneTiers
        , twoTiers: twoTiers
    }
    h.soust = h.pBorderTop + h.pPaddingTop

    let oBounds = o.getBoundingClientRect()

    // let oTop =  oBounds.top - (pBounds.top + soust)
    let oTop    = o.offsetTop - h.soust
      , pScroll = parent.scrollTop
      , oSpace  = {from:oTop, to: oTop + oBounds.height}
      , pSpace  = {from:pScroll, to:h.pHeight + pScroll}

    // console.log({
    //   oBounds: oBounds
    // , hdata: h
    // , oSpace: oSpace
    // , pSpace: pSpace
    // })

    if ( oSpace.from < pSpace.from || oSpace.to > pSpace.to ) {
      var tscrol
      if ( oSpace.from < pSpace.from ) {
      //   // <= On est en train de monter et l'item se trouve au-dessus
      //   // => Il faut placer l'item en bas
      //   tscroll = oSpace.from + pBounds.height - oBounds.height
      tscrol = Math.round(oSpace.from - (options.fromTop || h.twoTiers))
      } else {
      //   // <= On est en train de descendre et l'item se trouve en dessous
      //   // => Il faut placer l'item en haut
      //   tscroll = oSpace.from
      tscrol = Math.round(oSpace.from - (options.fromTop || h.oneTiers))
      }
      // console.log("L'item est en dehors, il faut le replacer. Scroll appliqué :", tscrol)
      // parent.scrollTo(0, tscrol)
      if ( options.smooth === false ) {
        parent.scroll({top: tscrol, behavior:'auto'})
      } else {
        parent.scroll({top: tscrol, behavior:'smooth'})
      }
    }
  }


}
Object.defineProperties(UI,{
  body:{get(){return document.querySelector('body')}}
, header:{get(){return document.querySelector('section#header')}}
, footer:{get(){return document.querySelector('section#footer')}}
, footerMessage:{get(){return this.footer.querySelector('span#message')}}
, rightColumn:  {get(){return document.querySelector('section#right-column')}}
, leftColumn:   {get(){return document.querySelector('section#left-column')}}
, UI_HEIGHT:{get(){return window.innerHeight}}
, UI_WIDTH: {get(){return window.innerWidth}}
})
