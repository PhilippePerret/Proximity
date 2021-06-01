'use strict'

const path  = require('path')
const fs    = require('fs')
const {app} = require('electron')

const App = {
  getProductName(){
    return this.data.productName || this.data.name
  }
, version(){
    return this.data.version
  }

, get data(){
    if (undefined === this._data){
      this._data = require(path.join(app.getAppPath(),'package.json'))
    }
    return this._data
  }
}

module.exports = App
