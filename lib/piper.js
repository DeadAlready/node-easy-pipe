/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var util = require('util');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

module.exports = createPipeStream;
  
function createPipeStream(){
  var proc;
  if(arguments[0] instanceof EventEmitter){
    proc = arguments[0];
  } else {
    proc = spawn.apply({}, normalizeInput.apply(this, arguments));
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

function ShellStream(args){
  if(this instanceof ShellStream === false){
    return new ShellStream(args);
  }
  this._command = args;
  this._events = [];
  var self = this;
  ['stdin','stdout','stderr'].forEach(function(stream){
    self[stream] = {on:addEvent,_events:[]};
  });
}
var addEvent = function(event, func){
  this._events.push({'e':event, 'f':func})
}

ShellStream.prototype.on = addEvent;
ShellStream.prototype.run = function(){
  var self = this;
  var newSpawn = createPipeStream.apply({}, self._command);
  self._events.forEach(function(ev){
    newSpawn.on(ev.e, ev.f);
  });
  ['stdin','stdout','stderr'].forEach(function(stream){
    self[stream]._events.forEach(function(ev){
      newSpawn[stream].on(ev.e, ev.f);
    });
  });
  return newSpawn;
}

/**** HELPERS ****/
function normalizeInput(command, args, opts){
  var input= {
    command:'',
    args:[],
    opts:null
  };
  if(!command){
    throw new TypeError('Invalid command');
  }
  if(!util.isArray(args)){
    if(typeof args === 'object' && !opts){
      input.opts = args;
    }
    args = [];
  }
  if(typeof opts !== 'object' || util.isArray(opts)){
    input.opts = null;
  } else {
    input.opts = opts;
  }
  
  if(typeof command === 'string'){
    var arr = command.split(' ');
    input.command = arr.shift();
    arr.forEach(function(arg){
      input.args.push(arg);
    });
  }
  args.forEach(function(arg){
    input.args.push(arg);
  });
  
  return [input.command, input.args, input.opts];
}