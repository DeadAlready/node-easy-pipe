/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk) {
  console.log('data: ' + chunk);
});