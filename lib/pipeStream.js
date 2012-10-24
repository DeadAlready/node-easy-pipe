/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var util = require('util');
var spawn = require('child_process').spawn;

function PipeStream(){
  if(this instanceof PipeStream === false){
    return PipeStream.constructor.apply({},arguments);
  }
  this._process = spawn.apply(this, arguments);
  for(var i in this._process){
    this[i] = this._process[i];
  }
}

PipeStream.prototype.and = function(){
  
}

module.exports = PipeStream;