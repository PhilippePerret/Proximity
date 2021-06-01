'use strict';

const COLORSTABLE = {
  blues:{
      light:['#5199FF','#1771F1','#0260E8','#0351C1','#2300B0','#7EB3FF','#BDCCFF','#1EC9E8']
    , dark: ['#0043A4','#002D6D','#4400B2','#052555','#2E3F7F']
  }
  , greens:{
      light:['#CEFF9D','#BEF761','#AEE8E4','#5BFF62','#51EAFF','#B5FBDD','#76FEC5','#41B619','#45D09E','#17F1D7','#4BB462','#00CF91','#48CFAF']
    , dark: ['#748700','#4D8802','#00848C','#004156','#2398AB','#116315','#116315','#1E3C00']
    }
  , greys:{
        light:['#E6E7E8','#D1D3D4','#D7E1E9']
      , dark:['#939598','#808285','#6D6E71','#58595B','#414042']
    }
  , yellows:{
        light:['#F7F272','#FFFCBB','#FBFF00','#FFF851','#FFE55E']
      , dark:['#FFD600','#F5E027','#D6C21A']
    }
  , oranges:{
        light:['#FBCEB5','#FFE0BC','#FE9E76','#FFC46B','#FFCB8B','#FFAF50']
      , dark:['#FFAD32','#FC9A40','#FF905A','#FE634E','#DF8600','#FF6B00','#FFA96B','#FF7A2F','#FB9F82','#F39629','#FF756B','#F85C50']
    }
  , reds:{
        light:['#FFDFDC']
      , dark:['#E20338','#FF9CA1','#DCABAE','#FF7272','#FF008B','#E85668','#FF0000','#FF2970','#BE5D77','#BC0022','#B40A1B']
    }
  , purples:{
        light:['#E47CCD','#FFBEED','#EF2FA2','#F375F3']
      , dark:['#FD0079','#A854A5','#CA1A8E','#C23A94','#B10361','#7C3668','#810B44']
    }
  , divers:{
        light:[]
      , dark:['#873600','#663333']
  }
}
const Colors = {
  /**
    Retourne une couleur au hasard
    @param {Hash} options
                  :onlyDark   Seulement les couleurs sombres
                  :onlyLight  Seulement les couleurs lumineuses/claires
  **/
  round(options){
    let colorsTable = this.getTableByOptions(options);
    console.log("colorsTable",colorsTable)
    var keys = Object.keys(colorsTable)
  }
, next(options){
    let colorsTable = this.getTableByOptions(options);
    if ( undefined === this.colorKeys ) this.colorKeys = Object.keys(colorsTable)
    if ( undefined === this.keysCount )  this.keysCount = this.colorKeys.length
    if ( undefined === this.ikey ) this.ikey = -1
    this.ikey = (++ this.ikey) % this.keysCount
    // On prend la couleur générale correspondante
    let key   = this.colorKeys[this.ikey]
    let color = colorsTable[key]
    color.handler = (++color.handler) % color.count
    console.log("ikey = %d, key = '%s', handler = %d, couleur = '%s', color = ", this.ikey, key, color.handler, color.colors[color.handler], color)
    return color.colors[color.handler]
  }
, getTableByOptions(options){
    if ( options && options.onlyDark ){
      return this.darkColorsTable
    } else if (options && options.onlyLight) {
      return this.lightColorsTable
    } else {
      return this.allColorsTable
    }
  }
}
Object.defineProperties(Colors,{
  darkColorsTable:{get(){
    if ( undefined === this._darkcolorstable ) {
      this._darkcolorstable = {}
      for(var kcolor in COLORSTABLE){
        Object.assign(this._darkcolorstable, {[kcolor]: {colors:COLORSTABLE[kcolor].dark, handler:0, count:COLORSTABLE[kcolor].dark.length}})
      }
    } return this._darkcolorstable
  }}
, lightColorsTable:{get(){
    if ( undefined === this._lightcolorstable ) {
      this._lightcolorstable = {}
      for(var kcolor in COLORSTABLE){
        Object.assign(this._lightcolorstable, {[kcolor]: {colors:COLORSTABLE[kcolor].light, handler:0, count:COLORSTABLE[kcolor].light.length}})
      }
    } return this._lightcolorstable
  }}
, allColorsTable:{get(){
    if ( undefined === this._allcolorstable ) {
      this._allcolorstable = {}
      for(var kcolor in COLORSTABLE){
        Object.assign(this._allcolorstable, {[kcolor]: {colors:COLORSTABLE[kcolor].light, handler:0, count:COLORSTABLE[kcolor].light.length}})
        this._allcolorstable[kcolor].colors.push(...COLORSTABLE[kcolor].dark)
        this._allcolorstable[kcolor].count += COLORSTABLE[kcolor].dark.length
      }
    } return this._allcolorstable
  }}
})
