'use strict'
/** ---------------------------------------------------------------------
  *   Classe Report

  ---------------
   Version 1.0.0
  ---------------

  *   Gestion des rapports
*** --------------------------------------------------------------------- */
class Report {

  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  static get reportBox(){
    DGet('#report') || this.build()
    if ( undefined === this._reportbox){
      this._reportbox = DGet('#report')
    }
    return this._reportbox
  }

  static build(){
    document.body.appendChild(DCreate('DIV',{id:'report'}))
    DGet('#report').addEventListener('click', ev => {DGet('#report').remove(); return stopEvent(ev)})
  }

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(owner){
    this.owner = owner
  }

  /**
    Permet de construire un rapport final
  **/
  add(label, value) {
    this.reportLines || ( this.reportLines = [] )
    this.reportLines.push({label:label, value:value})
  }

  /**
    Écrit le rapport

    param {String} output   Sortie à utiliser (pour le moment : la console)
                            {HTMLElement} L'élément dans lequel mettre le rapport
  **/
  print(output) {
    output || ( output = this.constructor.reportBox )
    output.innerHTML = '<em class="small">(cliquez pour fermer le rapport)</em><br><br>'
    this.reportLines.forEach( dline => {
      output.appendChild(DCreate('DIV', {class:'report-line', inner:[
        DCreate('LABEL', {inner:dline.label})
      , DCreate('SPAN', {class:'report-value', inner:String(dline.value)})
      ]}))
    })
  }

}
