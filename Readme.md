# Abstract-Store

The problem I faced, that it was highly unclear what backend storage technology would suit our needs best. Also there was no clear means to migrate from one to another.

So the idea of this module was to provide a very few methods that any storage mechanism would need to fulfill and then implement that interface with a multitude of backend means.

In addition there is a *multi* backend that allows for migration by reading from the specified stores in order and doing writes by writing to the stores either in order or only to the first. Ths way one could migrate the storage from one method to the next by keeping the old mechanism around as a read-only until all the data has been migrated.

## Install

    npm install abstract-store

## API

### Storage Creation

    var Store = require('store');
    Store.create('<url>'[, <options>], function(err, storeInstance) {

    });

Supported URL schemas are:

 * *mongodb* - a valid mongodb URL that can also be provided to MongoClient
 * *riak* - to connect to a riak cluster. (Example: *riak://default.host.name[:port]*, the *options* can contain information on other cluster nodes)
 * *nedb* - is almost like a *file://* but it points to a base directory to use for storage. (Example: *nedb:///path/to/storage/location)
 * *s3* - describes what Amazon-S3 Bucket to use (Example: *s3://bucketname*, the options contain access credentials and access methodology. See [knox](http://npmjs.org/package/knox) for details)
 * *levelup* - is almost like a *file://* but it points to a base directory to use for storage. (Example: *levelup:///path/to/storage/location)
 * *multi* - chain multiple storage mechanisms (Example: *multi://name-to-describe-it* the important stuff is in the options)

### Operations

#### storeInstance.get(key, callback)
#### storeInstance.put(key, value, callback)
#### storeInstance.del(key, callback)
#### storeInstance.key([keyprefix, ]callback)

## License

(The MIT License)

© 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

**THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**
