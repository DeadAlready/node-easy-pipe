/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';
var utils = require('./utils');
var streams = ['stdin','stdout','stderr'];
var pipeStream = require('./pipeStream');

module.exports = ShellStream;

function ShellStream(args){
  if(this instanceof ShellStream === false){
    return new ShellStream(args);
  }
  this._command = args;
  this._events = [];
  var self = this;
  streams.forEach(function(stream){
    self[stream] = {on:addEvent,_events:[]};
  });
}
var addEvent = function(event, func){
  this._events.push({'e':event, 'f':func})
}

ShellStream.prototype.on = addEvent;
ShellStream.prototype.run = function(){
  var self = this;
  var newSpawn = pipeStream.createPipeStream.apply({}, self._command);
  self._events.forEach(function(ev){
    newSpawn.on(ev.e, ev.f);
  });
  streams.forEach(function(stream){
    self[stream]._events.forEach(function(ev){
      newSpawn[stream].on(ev.e, ev.f);
    });
  });
  return newSpawn;
}