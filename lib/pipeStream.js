/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var utils = require('./utils');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var ShellStream = require('./shellStream');

module.exports.createPipeStream = createPipeStream;

/**
 * Main entrance function, will create PipeStream or joined pipe based on input
 * 
 * @param {Object|String|Array} cmd a Stream or Spawn object 
 *    or string command to create a spawn object 
 *    or an array of the previous types
 * @param {Array} [args=[]] optional array to string command
 * @param {Object} [opts={}] optional options to string command
 * @returns {PipeStream}
 */
function createPipeStream(cmd/*, args, opts*/){
    var proc;
    var command;

    if(Array.isArray(cmd)){
    // We have an array so create a pipe from all elements
    var firstCmd = cmd.shift();
    var open = Array.isArray(firstCmd) ? createPipeStream.apply({}, firstCmd) : createPipeStream(firstCmd);
    cmd.forEach(function(p){
        open = open.pipe(p);
    });
    return open;

    } else if(cmd instanceof EventEmitter){
        // Take the eventemitter as base
        proc = cmd;
        command = 'pre-defined';

    } else if(typeof cmd === 'object'){
        throw new TypeError('Invalid input, expected object type -> EventEmitter');

    } else {
        // We have input for Spawn command, normalize the input and create spawn
        var input = utils.normalizeInput.apply(this, arguments);
        command = utils.getCommand(input);
        proc = spawn.apply({}, input);
    }

    // Create inner pointer for command
    proc._command = command;

    // Check if process is still alive
    if(proc.exitCode){
        throw new Error('Process already dead');
    }

    return PipeStream(proc);
}

/**
 * Function for adding PipeStream functionality to an EventEmitter
 * @param {EventEmitter} self
 * 
 * @return {PipeStream}
 */
function PipeStream(self){
    // Inner pipeline handle
    self._pipeline = [self];
    // Inner position handle
    self._nr = 0;
    // Modify object
    wrapMethods(self);
    addFunctions(self);
    connectEvents(self);
    addEventHandlers(self);

    return self;
}

/**
 * Function for wrapping default EventEmitter functions to return itself
 * 
 * @param {EventEmitter} self
 * @returns {EventEmitter}
 */
function wrapMethods(self){
    var methods = ['on'];
    var childObjects = ['stdin','stdout','stderr'];

    // Wrap on method
    methods.forEach(function(m){
        var old = self[m];
        self[m] = function(){
            old.apply(self, arguments);
            return self;
        };
    });

    // If its a spawn object then wrap child EventEmitters
    if(utils.isSpawn(self)){
        childObjects.forEach(function(child){
            methods.forEach(function(m){
                var old = self[child][m];
                self[child][m] = function(){
                    old.apply(self[child], arguments);
                    return self;
                };
            });
        });
    }
}

/**
 * Adds extra functionality to EventEmitter
 * 
 * @param {EventEmitter} self
 * @returns {EventEmitter}
 */
function addFunctions(self){
    // Function for assigning a process to run after the end of this PipeStream
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
    };
  
    var oldPipe = self.pipe ? self.pipe.bind(self) : false;
    // Function for adding a new pipe to the pipeline
    self.pipe = function(){
        // Create pipe and add it to the pipeline hierarchy
        self._pipe = createPipeStream.apply({}, arguments);
        self._pipe._parent = self;
        self._addPipe(self._pipe);
        self._pipe._pipeline = self._pipeline;

        // Pipe the necessary data events to the new PipeStream
        if(utils.isSpawn(self)){
            self.stdout.pipe(utils.isSpawn(self._pipe) ? self._pipe.stdin:  self._pipe);
            self.stderr.on('data', function(d){
                self._pipe.emit('error', d);
            });
        } else {
            if(utils.isSpawn(self._pipe)){
                oldPipe(self._pipe.stdin);
                self.on('error',function(d){
                    self._pipe.stderr.emit('data', d);
                });
            } else {
                oldPipe(self._pipe);
                self.on('error',function(d){
                    self._pipe.emit('error', d);
                });
            }
        }
        // return new PipeStream
        return self._pipe;
    };

    // Internal function for appending a PipeStream to pipeline
    Object.defineProperty(self, '_addPipe',{value:function(pipe){
        self._pipeline.push(pipe);
        pipe._nr = self._pipeline.length - 1;
        pipe._error = self._error;
    }});


    // Internal function for destroying the whole pipeline
    Object.defineProperty(self, '_cleanUp', {
        value: function(){
            this._pipeline.forEach(function(p){
                p._error = null; // Make sure error is called only once.
                if(p.kill){
                    p.kill();
                } else if(p.destroy){
                    p.destroy();
                }
            });
        }
    });

    // Function for retrieving the pipeline beginning
    self.first = function(){
        return self.get(0);
    };

    // Function for retrieving the pipeline end
    self.last = function(){
        return self.get(self._pipeline.length -1);
    };

    // Function for retrieving the nth element in pipeline
    self.get = function(n){
        return self._pipeline[n] || false;
    };

    // Function for appending an error handler for all elements in pipeline
    self.error = function(fn){
        self._pipeline.forEach(function (section) {
            section._error = fn;
        });
        return self;
    };
}

/**
 * Function for connecting some events
 * 
 * @param {EventEmitter} self
 */
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
/**
 * Function for adding internal event handlers
 * @param {EventEmitter} self
 */
function addEventHandlers(self){
    self.on('error',function(d){
        var fn = self._error;
        self._cleanUp();
        if(fn){
            fn('pipeline[' + self._nr + ']:"' + self._command + '" failed with: ' + d.toString());
        }
    });
}