'use strict'
/** ---------------------------------------------------------------------
  *   Classe TextUtils
  *   ----------------
  *   Méthodes utiles pour la gestion des textes
*** --------------------------------------------------------------------- */

class TextUtils {

  static get FINALE_PHRASE(){
    if (undefined === this._finalephrase) {
      this._finalephrase = /((?:[\!\?\.…]+)?[\n\!\?\.;…])/g
      // this._finalephrase = /([\!\?\.…]+[\n\!\?\.;…])/g
    } return this._finalephrase
  }
  /**
    Méthode qui prend le texte +str+ et en retourne les phrases (avec leur
    ponctuation à la fin)
  **/
  static splitIntoSentences(str) {
    // Pour faciliter le travail et augmenter peut-être la vitesse, on
    // divise d'abord par paragraphe.
    // let parags = str.split(CR)
    // parags.forEach(parag => {
    //
    // })

    // On divise, mais en obtenant une liste qui contient :
    // [phrase,ponctuation,phrase,ponctuation, etc.]
    let phrasesAndPunct = str.split(this.FINALE_PHRASE)
    // console.log("phrasesAndPunct = ", phrasesAndPunct)

    var phrases = []
    let nombrePortions = phrasesAndPunct.length
    if ( phrasesAndPunct[nombrePortions-1] == '') {
      -- nombrePortions;
      phrasesAndPunct.pop()
    }
    for (var i = 0; i < nombrePortions ; i+=2) {
      phrases.push(`${phrasesAndPunct[i]}${phrasesAndPunct[i+1]}`)
    }
    // console.log("Phrases reconstituées totales retournées :",phrases)

    return phrases
  }


}
