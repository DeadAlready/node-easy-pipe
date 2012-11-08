/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var utils = require('./utils');
var streams = ['stdin','stdout','stderr'];
var pipeStream = require('./pipeStream');

module.exports = ShellStream;

/**
 * Main function for creating a shellstream
 * 
 * @param {Array} args -> arguments to apply to PipeStream
 * 
 * @returns {ShellStream}
 */
function ShellStream(args){
  if(this instanceof ShellStream === false){
    return new ShellStream(args);
  }

  this._command = args;
  this._events = [];
  var self = this;
  // Create holders for events to be added
  streams.forEach(function(stream){
    self[stream] = {on:addEvent,_events:[]};
  });
}
/**
 * Mock the event adding procedure
 * 
 * @param {String} event -> name of the event
 * @param {Function} func -> function to call
 * @returns {undefined}
 */
ShellStream.prototype.on = function(event, func){
  this._events.push({'e':event, 'f':func});
};

/**
 * Function for creating a PipeStream from the ShellStream object
 * 
 * @returns {PipeStream}
 */
ShellStream.prototype.run = function(){
  var self = this;
  // Create PipeStream
  var newSpawn = pipeStream.createPipeStream.apply({}, self._command);
  
  // Add cached events
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