'use strict'
/**
  Composant Text/T
  ----------------
  Gestion des textes
  
  ---------------
   version 1.0.0
  ---------------

**/

const CR = `
`

const Text = {
  formate(str, format){
    format = format || 'markdown'
    switch (format) {
      case 'markdown':
        return this.formateMarkdown(str)
      default:
        return str
    }
  }

, MD_TAGS: {
    '\\*\\*': 'bold', '\\*': 'italic'
  }
, formateMarkdown(str){
    const my = this
    // console.log("Entrée : ", str)
    for ( var tag in my.MD_TAGS ) {
      var rep = my.MD_TAGS[tag]
      var reg = new RegExp(`${tag}(.+?)${tag}`, 'g')
      str = str.replace(reg, `<span class="${rep}">$1</span>`)
    }
    // console.log("Sortie : ", str)
    return str
  }// /formateMarkdown

}
const T = Text
