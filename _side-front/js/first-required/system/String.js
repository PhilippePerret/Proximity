'use strict';
/** ---------------------------------------------------------------------
  *   String (methodes utiles)
  *
  ------------
  version 0.2.0

  # 0.2.0
      + méthode 'temp' pour "détemplatiser" un string
  # 0.1.1
      + méthode red
*** --------------------------------------------------------------------- */

const RC = `
`

/**
  Retourne le texte +texte+ avec remplacement des variables +params+ qui
  sont définies dans le texte par %{variable}
**/
function temp(texte, params){
  if ( params ) {
    texte = texte.replace(/\%\{([^\}]+)\}/g, (tout, key) => {
      if ( undefined !== params[key] ) { return params[key]}
      else return `# Unknown Param '${key}' #`
    })
  }
  return texte
}

/**
  Retourne un texte PRE-formaté selon +format+ d'après l'instance +instance+

  +Params+::
    +format+= [String] Le format
        C'est un texte normal, mais où les textes à remplacer sont remplacés
        par dex %{prop:pad} où 'prop' est une propriété de l'+instance+ et
        'pad' est la longueur à donner
        Note : si 'prop' doit être un texte spécial qui n'est pas à proprement
        parler une propriété de l'instance, on peut "fabriquer" une fausse
        propriété qui retournera la valeur attendue.
    +instance+= [Any] Un object d'une classe quelconque, sur laquelle on doit
        appliquer le format.

  +return+:: [String] Un string préformaté (donc où les espaces délimiteront
    le texte)
**/
function PREFormate(format, instance){
  return format.replace(/\%\{([^\}]*)\}/g, (tout,mark) => {
    var [prop, padding] = mark.split(':')
    var remp = instance[prop]
    if ( 'string' === typeof remp ) remp = `'${remp}'`
    remp = remp || ''
    if ( padding ) remp = String(remp).padEnd(Number(padding))
    return remp
  })
}

/**
  Retourne le message +msg+ en rouge (dans un span)
**/
function red(msg){
  return `<span class="red">${msg}</span>`
}
