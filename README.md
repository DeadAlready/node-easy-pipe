[easy-pipe](https://github.com/DeadAlready/node-easy-pipe) is a helper wrapper for handling multiple spawn processes.

## General

Easy-pipe is a module designed for easyly spawning child_processes and creating pipelines
by piping form one to the other. It also supports streams, so they can be used intermittently.

easy-pipe module exports a function, which can be used to create a PipeStream object.

## PipeStream

PipeStream object is the wrapper around Stream and Spawn objects to allow easy connection and handling.

### Creating

PipeStream object can be created using the easy-pipe function.

The function supports the following input types:
+ (EventEmitter) -> the first argument is an EventEmitter object either a Stream or a ChildProcess
+ (String, [Array], [Object]) -> the same input as for child_process.spawn, 
the String however unlike the original spawn command will be split on spaces and 
all but the first element will be prepended to the Array portion, 
which will allow simple string spawn commands as seen in previous example
+ (Array) -> an array of the previous input types. Every element of the array will be passed through
this function again, and the output will be piped along the created PipeStream objects. 
The last object will be returned.

#### Examples

    var $p = require('easy-pipe');
    
    // Using single string input
    var pipe = $p('tail -f /var/log.txt');
    
    // Using a Stream object
    var pipe2 = $p(require('fs').createReadStream('/var/log.txt'));
    
    // Using a Spawned object
    var spawn = require('child_process').spawn;
    var gzip = spawn('gzip', ['/var/log.txt']);
    var pipe3 = $p(gzip);

    // Using an array
    var pipe4 = $p([['tail',['-f','/var/log.txt']],'gzip',require('fs').createWriteStream('/var/log.gz'));

### Methods

#### .pipe

The .pipe method allows to extend the pipeline by one more PipeStream object.
A new PipeStream object will be created based on input (view Creating) and the output
of current PipeStream object will be Piped to the new. The new PipeStream will be returned,
making the process chainable.

    var fs = require('fs');
    var pipeLine = $p(fs.createReadStream('/var/log.txt'))
                    .pipe('gzip')
                    .pipe(fs.createWriteStream('/var/log.gz'));

All the PipeStream objects will be appended to the internal _pipeline array, 
and are accessible from all parts of the pipe using the following commands

##### .get(n), .last(), .first()

.get command lets you get the n-th element in the pipeline. Will return PipeStream or false.
.last is a convenience function returning the last element in _pipeline
.first is a convenience function returning the first element in _pipeline

#### .error(Function)

The .error method allows to append an error listener for the whole pipeline with one command.
The function will be called no matter which element in the pipeline broke.

### Events

PipeStream object also merges some events under one name.

#### 'data'

The stdout['data'] and 'data' data events are merged.

#### 'error'

The 'error' and stderr['data'] events are merged

### Event handlers

The event handler binding function .on() will return the object so it is chainable.

## License

The MIT License (MIT)
Copyright (c) 2012 Karl Düüna

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.