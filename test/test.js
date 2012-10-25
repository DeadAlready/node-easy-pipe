/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';
var fs = require('fs');
var assert = require('assert');
var $p = require('../index');
var s = require('child_process').spawn('node',['test1.js']);
var writeS = fs.createWriteStream('test.log');

var a = $p(s)
  .pipe('node test2.js')
  .pipe('node test2.js')
  .on('data',function(d){
    console.log(d.toString());
    assert.equal('data: data: hello', d.toString('utf8'));
  }).first()
  .on('data', function(d){
    console.log(d.toString());
  });
  
var b = $p([s,'node test2.js','node test2.js']).on('data',function(d){
    console.log(d.toString());
    assert.equal('data: data: hello', d.toString('utf8'));
  }).first()
  .on('data', function(d){
    console.log(d.toString());
  });