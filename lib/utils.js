/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var util = require('util');

Object.keys(util).forEach(function(fn) {
    module.exports[fn] = util[fn].bind(util);
});


/**
 * Function for normalizing input
 * 
 * @param {String} command
 * @param {Array} [args=[]]
 * @param {Object} [opts={}]
 * @returns {Array}
 */
module.exports.normalizeInput = function(command, args, opts){
    var input= {
        command:'',
        args:[],
        opts:null
    };

    if(!command){
        throw new TypeError('Invalid command');
    }

    if(!Array.isArray(args)){
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
};

/**
 * Returns the command as a string
 * 
 * @param {Array} input
 * @returns {String}
 */
module.exports.getCommand = function(input){
    return input[0] + ' ' + input[1].join(' ');
};

/**
 * Determines if the object is a Spawn object
 * 
 * @param {Object} 
 * @returns {Boolean}
 */
module.exports.isSpawn = function(o){
    return typeof o.stdout === 'object' && o.kill;
};