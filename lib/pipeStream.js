/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var utils = require('./utils');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var ShellStream = require('./shellStream');

module.exports.createPipeStream = createPipeStream;

function createPipeStream(){
  var proc;
  if(arguments[0] instanceof EventEmitter){
    proc = arguments[0];
  } else {
    proc = spawn.apply({}, utils.normalizeInput.apply(this, arguments));
  }
  
  return PipeStream(proc);
}

function PipeStream(self){
  self._and;
  wrapMethods(self);
  addFunctions(self);
  connectEvents(self);
  return self;
}

function wrapMethods(self){
  var methods = ['on'];
  var childObjects = ['stdin','stdout','stderr'];
  
  methods.forEach(function(m){
    var old = self[m];
    self[m] = function(){
      old.apply(self, arguments);
      return self;
    }
  });
  childObjects.forEach(function(child){
    methods.forEach(function(m){
      var old = self[child][m];
      self[child][m] = function(){
        old.apply(self[child], arguments);
        return self;
      }
    });
  });
}

function addFunctions(self){
  self.and = function(){
    self._and = new ShellStream(arguments);
    self.on('exit',function(code){
      if(code !== 0){
        self.emit('error',code);
        return;
      }
      self._and = self._and.run();
    });
    return self._and;
  }
  
  self.pipe = function(){
    self._pipe = createPipeStream.apply({}, arguments);
    self.stdout.pipe(self._pipe.stdin);
    self.stderr.pipe(self._pipe.stderr);
    return self._pipe;
  }
}

function connectEvents(self){
  self.stdout.on('data', function(d){
    self.emit('data',d);
  });
}