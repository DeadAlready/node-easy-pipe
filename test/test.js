/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var assert = require('assert');
var $p = require('../index');
var s = require('child_process').spawn('node',['test1.js']);

var a = $p(s)
    .pipe('node test2.js')
    .pipe('node test2.js')
    .pipe('node test3.js')
    .on('data',function(d){
        assert.equal('data: data: hello', d.toString('utf8'));
    })
    .first()
    .on('data', function(d){
        assert.equal('hello', d.toString('utf8'));
    }).error(function(e){
        if(e.indexOf('pipeline[3]:"node test3.js" failed with:') === 0) {
            console.log('Test1 All OK');
        } else {
            console.log('Unexpected error', e);
        }
    });

var s2 = require('child_process').spawn('node',['test1.js']);
var b = $p([s2,'node test2.js','node test2.js'])
    .on('data',function(d){
        assert.equal('data: data: hello', d.toString('utf8'));
      })
    .first()
    .on('data', function(d){
        assert.equal('hello', d.toString('utf8'));
        console.log('Test2 All OK');
    });