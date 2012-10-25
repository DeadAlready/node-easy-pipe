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
  
  if(proc.exitCode){
    throw new Error('Process already dead');
  }
  
  return PipeStream(proc);
}

function PipeStream(self){
  self._pipeline = [self];
  wrapMethods(self);
  addFunctions(self);
  connectEvents(self);
  addEventHandlers(self);
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
  if(utils.isSpawn(self)){
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
  
  var oldPipe = self.pipe ? self.pipe.bind(self) : false;
  
  self.pipe = function(){
    self._pipe = createPipeStream.apply({}, arguments);
    self._pipe._parent = self;
    self._addPipe(self._pipe);
    self._pipe._pipeline = self._pipeline;
    
    if(utils.isSpawn(self)){
      if(utils.isSpawn(self._pipe)){
        self.stdout.pipe(self._pipe.stdin);
        self.stderr.pipe(self._pipe.stderr);
      } else {
        self.stdout.pipe(self._pipe);
        self.stderr.on('data',function(d){
          self._pipe.emit('error',d);
        });
      }
    } else {
      if(utils.isSpawn(self._pipe)){
        oldPipe(self._pipe.stdin);
        self.on('error',function(d){
          self._pipe.stderr.emit('data',d);
        });
      } else {
        oldPipe(self._pipe);
        self.on('error',function(d){
          self._pipe.emit('error',d);
        });
      }
    }
    return self._pipe;
  }
  
  self._addPipe = function(pipe){
    self._pipeline.push(pipe);
//    if(self._parent){
//      self._parent._addPipe(pipe);
//    }
  }
  
  self._cleanUp = function(){
    this._pipeline.forEach(function(p){
      if(utils.isSpawn){
        p.kill();
      } else {
        p.destroy();
      }
    });
  }
  
  self.first = function(){
    return self._pipeline[0];
  }
  
  self.last = function(){
    return self._pipeline[self._pipeline.length -1];
  }
  
  self.get = function(n){
    return self._pipeline[n] || false;
  }
}

function connectEvents(self){
  if(self.stdout){
    self.stdout.on('data', function(d){
      self.emit('data', d);
    });
    self.stderr.on('data', function(d){
      self.emit('error', d);
    });
  }
}

function addEventHandlers(self){
  self.on('error',function(d){
    self._cleanUp();
  });
}