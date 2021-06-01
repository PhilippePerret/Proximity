'use strict'
/** ---------------------------------------------------------------------
  *   Extension de UI
  *
*** --------------------------------------------------------------------- */
Object.assign(UI, {

  appInit(){
    console.log('-> appInit')
    this.appObserve()
    this.setDimentions()
  }

, log(msg){
    Log.write('[UI_app]', 'color:#555555;', msg)
  }

  /**
    Préparer les dimensions de l'interface

    Note : ne pas appeler cette méthode on onwidow.resize car elle rajoute
    des règles à une feuille de style (il faudrait d'abord voir comment les
    supprimer, peut-être avec deleteRule).

  **/
, setDimentions(){
    // Réglage de la hauteur des pages pour que ça ne dépasse pas.
    const HPage = this.UI_HEIGHT - 110
    const WPage = this.containerLeftPage.innerWidth
    // this.log(`Hauteur de page mise à ${HPage} pixels`)
    // On le modifie dans le style lui-même
    const SHPage = DGet('#stylesheet_app_page').sheet
    // console.log("SHPage = ", SHPage)
    // console.log("Styles : ", SHPage.cssRules)
    SHPage.insertRule(`.section-page .container-page .page {height:${HPage}px;}`,0)

    // On définit la taille de la police en fonction de la
    // taille de la fenêtre
    // coef doit être égal à 1 lorsque la largeur de la page WPage est à peu
    // près 680
    const coef = WPage / 680
    const fontSize = Math.round((16.1 * coef) * 10)/10
    SHPage.insertRule(`.section-page .container-page {font-size:${fontSize}pt;}`,2)
  }

, appObserve(){
    this.log('-> appObserve')
    // Observation des boutons pour afficher la page précédente ou la page
    // suivante.
    this.log('<- appObserve')
  }

})

Object.defineProperties(UI,{
  name:{get(){'extension UI properties (juste pour les virgules)'}}
  /**
    Le container DOM avec les informations proximités
  **/
, containerInfosProximites:{get(){
      return this._continfsprox || (this._continfsprox = DGet('#infos_proximites'))
    }}

, containerLeftPage:{get(){
    return this._contleftpage || (this._contleftpage = DGet('div#container-left-page'))
  }}

})
