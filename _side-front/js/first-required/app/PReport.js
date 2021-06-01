'use strict';
/** ---------------------------------------------------------------------
  *   Classe Report
  *   -------------
  *   Pour faire un rapport du texte

Ce rapport est autant utile pour le développement que pour la connaissance
du texte par l'utilisateur. Il doit présenter un maximum d'information, à
commencer par les proximités, et permettre de modifier certaines valeurs,
par exemple les canons ignorés, etc.
*** --------------------------------------------------------------------- */
class PReport {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */

  /**
    Instanciation du rapport pour le texte +ptexte+
  **/
  constructor(ptexte){
    this.ptexte = ptexte || PTexte.current
  }

  show(){
    this.build()
  }
  build(){
    UI.rightColumn.innerHTML = '' // s'il y en a un autre
    const header = DCreate('DIV', {
        class:'preport-header'
      , inner:"Rapport de proximité"
    })
    const RDivCanons  = CanonsReport.build(this.ptexte) /* Instance Div rétractable */
    const RDivOffsets = OffsetReport.build(this.ptexte) /* id. */
    // Assemblage de tous les éléments
    const div = DCreate('SECTION',{
        id: 'proximity-report'
      , class:'preport'
      , inner: [
            header
          , RDivCanons.div
          , RDivOffsets.div
        ]
    })
    UI.rightColumn.append(div)
  }

}

/** ---------------------------------------------------------------------
  *   Class OffsetReport
  *   ------------------
  *   Gestion des offsets et appartenances dans le rapport
  *
Ce rapport permet d'imprimer :
  - tous les offsets (page, paragraphes, mots) relatifs et absolus
  - toutes les appartenances (les éléments sont groupés entre eux)
*** --------------------------------------------------------------------- */
class OffsetReport {

  /**
    Construction du rapport
    -----------------------
    On fonctionne du premier au dernier mot
  **/
  static build(ptexte){

    // Format de ligne pour le mot
    const formatMotLine = "%{real:20} #%{id:12} RO: %{relOffset:10} AO: %{absOffset:15}"

    var mainContainer = []

    // Ça pue trop, j'essaie autrement
    PFile.items.forEach(pfile => {
      var pageContainer = pfile.paragraphs.map(paragraph => {
        return this.divOffsetsParag(paragraph.id, [])
      })
      mainContainer.push(this.divOffsetsPage(pfile.id, pageContainer))
    })


    return new DRetractable({
        id:'report-offsets'
      , titre:loc('report.offsets.titre')
      , opened:false
      , inner:mainContainer
    })

  } // /build

  static divOffsetsParag(paragId, containerParag = []){
    var parag = PParagraph.get(paragId)
    var dataR = {
        id: `paragraph-${paragId}`
      , titre: `Paragraphe #${paragId} <span class="tiny">(${containerParag.length} mots)</span>`
      , titre_buttons: DCreate('DIV',{inner:[
            DCreate('SPAN', {inner:`relatif offset (RO): ${parag.relOffset}`})
          , DCreate('SPAN', {inner:`absolute offset (AO): ${parag.absOffset}`})
          , DCreate('SPAN', {inner:`length: ${parag.length}`})
        ]})
      , inner: containerParag
      , opened: false
    }
    return new DRetractable(dataR).div
  }

  static divOffsetsPage(pageId, containerPage = []){
    const page = PFile.get(pageId)
    const dataR = {
        id: `page-${pageId}`
      , titre: `Page #${pageId} <span class="tiny">(${containerPage.length} paragraphes)</span>`
      , titre_buttons: `offset : ${page.offset}`
      , inner: containerPage
      , opened: false
    }
    return new DRetractable(dataR).div
  }
}
/** ---------------------------------------------------------------------
  *   Classe ReportCanon
  *   ------------------
  *   Gestion des canons dans le rapport
  *
*** --------------------------------------------------------------------- */
class CanonsReport {
  /** ---------------------------------------------------------------------
    *   CLASSE
    *
  *** --------------------------------------------------------------------- */

  /**
    Construction de la grande section pour contenir tous les canons
  **/
  static build(ptexte) {
    var divs = []
    // const formatMotLine =       format = `${String('%{real}' != '%{canon}' ? '%{real}' : 'id.').padEnd(20)}`
    //         + ` #%{id:12} RO:%{relOffset:12} AO:%{absOffset:15}`
    //         + ` %{markProximizable:21} %{markProximites:20}`
    //
    // const formatMotLine = "${String('%{real}' != '%{canon}' ? '%{real}' : 'id.').padEnd(20)}"
    //         + " #%{id:12} RO:%{relOffset:12} AO:%{absOffset:15}"
    //         + " %{markProximizable:21} %{markProximites:20}"
    const formatMotLine = "%{markRealOrId:20} #%{id:12} RO: %{relOffset:10} AO: %{absOffset:15}"
      + " %{markProximizable:21} %{markProximites:20}"
    // console.log("ptexte.canons = ", ptexte.canons)
    ptexte.canons.forEach(canon => {
      // console.log("Traitement du canon ", canon)
      var divsMots = []

      canon.items.forEach(mot => {
        divsMots.push(DCreate('DIV',{inner:mot.reportLine(formatMotLine)}))
      })
      const buttons = DCreate('DIV', {inner: [
          // Indication du fait que le canon est proximisable ou pas
          DCreate('SPAN', {inner:canon.isProximizable ? 'canon inclus' :`ignoré (${canon.nonProximizableReason})`})
          // Distance minimale
        , DCreate('SPAN', {inner:`distance minimale : ${canon.distanceMinimale}`})

      ]})
      const dataR = {
          id: `canon-${canon.id}`
        , titre: `${canon.canon} <span class="tiny">(${canon.count})</span>`
        , titre_buttons: buttons
        , inner: divsMots
        , opened: false
      }
      divs.push(new DRetractable(dataR).div )
    })
    return new DRetractable({id:'canons',titre:`Canons <span class="tiny">(${ptexte.canons.length})</span>`,opened:false, inner:divs})
  }
  /** ---------------------------------------------------------------------
    *   INSTANCE
    *
  *** --------------------------------------------------------------------- */
  constructor(pcanon){
    this.canon = pcanon
  }

  /**
    Construction de la section pour présenter un canon

    Elle se présente ainsi :

    >v
  **/
  build(){

  }
}
