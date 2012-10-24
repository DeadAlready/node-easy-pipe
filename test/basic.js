/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var $p = require('../index');
var s = require('child_process').spawn('node',['test.js']);

var a = $p(s).on('data',function(d){
  console.log('data');
  console.log(d.toString('utf8'));
}).pipe('node test2.js').on('data',function(d){
  console.log('data2');
  console.log(d.toString('utf8'));
});