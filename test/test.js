/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var assert = require('assert');
var $p = require('../index');
var s = require('child_process').spawn('node',['test1.js']);

var a = $p(s).pipe('node test2.js').on('data',function(d){
  assert.equal('data: hello', d.toString('utf8'));
});