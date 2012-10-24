/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';
var fs = require('fs');
var assert = require('assert');
var $p = require('../index');
var s = require('child_process').spawn('node',['test1.js']);
var writeS = fs.createWriteStream('test.log');

var a = $p(s).pipe(writeS).pipe('node test2.js').on('data',function(d){
  assert.equal('data: hello', d.toString('utf8'));
  assert.equal('hello',fs.readFileSync('test.log','utf8'));
});