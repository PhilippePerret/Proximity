'use strict';

const WAITFOR_LAPS = 100

class Action {
  // Pour faire un test
  test(val1, val2, val3){
    // Pour
  }

  /**
    Pour attendre que l'application ne soit plus occupée
  **/
  waitForNotBusy(){
    return this.waitFor(Busy.waitUntilNotBusy)
  }

  /**
    Pour attendre x secondes
    Pour le moment, la méthode sert juste à voir si l'asynchronicité
    fonctionne.
  **/
  wait(seconds) {
    return new Promise((OK,ko)=>{
      setTimeout(OK, seconds * 1000)
    })
  }

  /**
    Attend jusqu'à ce que la condition soit valide

    +condition+::[Function|String] Si c'est une méthode, elle doit retourner
        true ou false. Si elle renvoie true, la condition est considérée
        comme remplie.
        Si c'est un String, il est évalué avec 'eval'.
  **/
  waitFor(condition, timeout) {
    timeout = timeout || 60000
    var laps = 0
    var isTrue ;
    return new Promise(async (ok,ko)=>{
      while(true){
        laps += WAITFOR_LAPS
        if ( laps > timeout ) {
          return ko('--- timeout ---')
        } else {
          if ( condition instanceof Function ) {
            isTrue = condition.call(null)
          } else {
            isTrue = eval(condition)
          }
          if ( isTrue ) {
            return ok()
          } else {
            await this.wait(WAITFOR_LAPS/1000)
          }
        }
      }
    })
  }
  /*
      Complex actions

      Les actions complexes enchaînent plusieurs actions simples

  */

  /**
    Remplacer un mot par un autre texte
  **/
  replaceMotWith(mot_id, newStr) {
    return new Promise((ok,ko)=>{
      this.clickOn_mot_withMeta(mot_id)
      .then(this.fill_replaceField_with.bind(this,newStr))
      .then(this.clickOn_okButton_of_ProxToolsBox.bind(this))
      .then(ok)
      .catch(ko)
    })
  }

  /*
      Simple action
  */

  clickOn_mot(mot_id, options){
    return new Promise((ok,ko)=>{
      try {
        Dom.clickOn(`.mot[data-id="${mot_id}"]`, options)
        ok()
      } catch (err) { ko(err) }
    })
  }

  clickOn_mot_withMeta(mot_id){
    return this.clickOn_mot(mot_id, { metaKey: true })
  }

  fill_replaceField_with(str){
    return new Promise((ok,ko)=>{
      const element = DGet('INPUT[type="text"]', this.proxToolBox)
      element.value = str
      ok()
    })
  }

  clickOn_okButton_of_ProxToolsBox(){
    return new Promise((ok,ko)=>{
      const button = DGet('div.buttons button#btn-2')
      const condition = () => {return !!DGet('div.buttons button#btn-2')}
      this.waitFor(condition)
      .then(()=>{button.click();ok()})
      .catch(ko)
    })
  }

  get proxToolBox(){
    return DGet('div.dialog.replace-mot-input-field')
  }

}

class Dom {
  static clickOn(selector, options){
    const domElement = document.querySelector(selector)
    domElement || raise(`Le DOMElement '${selector}' est introuvable. Impossible de le cliquer.`)
    options = options || {}
    const event = new CustomEvent('click')
    Object.assign(event, options) // par exemple les modifiers
    domElement.dispatchEvent(event)
  }
}

module.exports = new Action()
