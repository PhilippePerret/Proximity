'use strict'

/**
  |
  | Exécute un script JS sur le renderer
  |
  | mainW doit avoir été défini dans app.js, comme constante globale, et
  | c'est la fenêtre ouverte.
**/
function execJS(methodAndArgs){
  mainW.webContents.executeJavaScript(methodAndArgs)
}

const ObjMenus = {

  get data_menus(){
    return [
      {
        label: 'Fichier'
      , enabled: true
      , submenu: [
          {
              label: loc('locution.open')
            , id: 'choose-ptexte'
            , accelerator: 'CmdOrCtrl+O'
            , enabled: true
            , click:function(){execJS("PTexte.chooseTexte.call(PTexte)")}
          }
        , {
              label: loc('word.reload')
            , id: 'reload-ptexte'
            , accelerator: 'CmdOrCtrl+R'
            , click:function(){execJS('PTexte.reloadCurrent.call(PTexte)')}
          }
        , { type:'separator' }
        , {
                label: loc('word.save')
              , id: 'save-ptexte'
              , accelerator: 'CmdOrCtrl+S'
              , enabled: true
              , click:function(){execJS("PTexte.saveCurrent.call(PTexte)")}
          }
        , { type:'separator' }
        , { role: 'quit' }
        ]
      }


    , {
        label: loc('word.editing')
      , enabled: true
      , submenu: [
            {role:'cancel', label:loc('word.cancel')}
          , {role:'redo', label:loc('word.redo')}
          , {type: 'separator'}
          , {role:'copy', label:loc('word.copy')}
          , {role:'cut', label:loc('word.cut')}
          , {role:'paste', label:loc('word.paste')}
        ]
      }



    , {
        label: loc('word.text')
      , enabled: true
      , id: 'menu-analyse'
      , submenu: [
          {
              label: loc('word.configuration')
            , id:'text-configuration'
            , accelerator: 'CmdOrCtrl+Shift+;'
            , enabled:true// TODO à régler
            , click: function(){
                execJS('PTexte.toggleConfig.call(PTexte)')
              }
          }
        , { type:'separator' }
        , {
              label: loc('ptexte.offsets.update.menu')
            , id:'update-words-offset'
            , accelerator: 'CmdOrCtrl+Shift+O'
            , enabled: true
            , click:function(){
                execJS("PTexte.current.updateOffsetFrom.call(PTexte.current,undefined,true)")
              }
          }
        ]
      }



    , {
        label: loc('app.word.analyse')
      , enabled: true
      , submenu: [
          {
              label: loc('app.locution.analyse.again')
            , id: 'texte-analyser'
            , accelerator: 'CmdOrCtrl+Shift+A'
            , enabled: true // Plus tard, dépendra de présence de texte ou non
            , click:function(){
                execJS("PTexte.forceAnalyseCurrent.call(PTexte)")
              }
          }
        , { type:'separator' }
        , {
              label: loc('ptexte.analyse.checker.menu')
            , id:'check-analyse'
            , accelerator: 'CmdOrCtrl+Shift+C'
            , enabled:true
            , click:function(){
                execJS("PTexte.current.check.call(PTexte.current)")
              }
          }
        , {type:'separator'}
        , {
              label: loc('app.locution.report.display')
            , id:'display-report'
            , accelerator: 'CmdOrCtrl+Shift+R'
            , enabled:true
            , click:function(){
                execJS("PTexte.displayRapport.call(PTexte)")
              }
          }
        , {type:'separator'}
        , {
              label: loc('app.locution.proximity.update')
            , id: 'update-proximities'
            , accelerator: 'CmdOrCtrl+Shift+U'
            , enabled: true // Plus tard, dépendra de présence de texte ou non
            , click:function(){
                execJS("Proximity.updateAllFrom.call(Proximity,PTexte.current,undefined,true)")
              }
          }
        ]//les subitems de Analyse
      }



    , {
        label: loc('word.tools')
      , enabled: true
      , submenu: [
            {
                label: loc('locution.app.reload')
              , accelerator: 'CmdOrCtrl+R'
              , click: () => {mainW.reload()}
            }
          , {type:'separator'}
          , {
                label: loc('locution.tests.run')
              , accelerator: 'CmdOrCtrl+Shift+T'
              , click:function(){execJS("App.runTests.call(App)")}
            }
          , {type:'separator'}
          , {label: loc('locution.web-console'), role:'toggleDevTools'}
        ]
      }

    ]
  }
}

module.exports = ObjMenus
