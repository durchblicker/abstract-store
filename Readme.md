# Abstract-Store

The problem I faced, that it was highly unclear what backend storage technology would suit our needs best. Also there was no clear means to migrate from one to another.

So the idea of this module was to provide a very few methods that any storage mechanism would need to fulfill and then implement that interface with a multitude of backend means.

In addition there is a *multi* backend that allows for migration by reading from the specified stores in order and doing writes by writing to the stores either in order or only to the first. Ths way one could migrate the storage from one method to the next by keeping the old mechanism around as a read-only until all the data has been migrated.

[![NPM](https://nodei.co/npm/abstract-store.png)](https://nodei.co/npm/abstract-store/)

## Install

    npm install abstract-store

## API

### Storage Creation

    var Store = require('store');
    Store('<url>'[, <options>], function(err, storeInstance) {

    });

Supported URL schemas are:

 * *mongodb* - a valid mongodb URL that can also be provided to MongoClient
 * *riak* - to connect to a riak cluster. (Example: *riak://default.host.name[:port]*, the *options* can contain information on other cluster nodes)
 * *s3* - describes what Amazon-S3 Bucket to use (Example: *s3://bucketname*, the options contain access credentials and access methodology. See [knox](http://npmjs.org/package/knox) for details)
 * *levelup* - is almost like a *file://* but it points to a base directory to use for storage. (Example: *levelup:///path/to/storage/location)
 * *memcache* - permits caching via MemCached. Of course this type will not support the *key* operation, but it will return an empty array of keys when asked to do it none the less. (Example: *memcache://your-host:port*)
 * *multi* - chain multiple storage mechanisms (Example: *multi://name-to-describe-it* the important stuff is in the options)

### Operations

#### storeInstance.get(key, callback)
#### storeInstance.put(key, value, callback)
#### storeInstance.del(key, callback)
#### storeInstance.key(keyprefix, callback)

### Buckets

In order to add namespaces this module contains a bucket dispatch mechanism.

    var Pea = require('pea');
    var Store = require('store');
    var bucket1 = Pea(Store, 'url1', {});
    var bucket2 = Pea(Store, 'url2', {});
    Pea.all(bucket1, bucket2).done(function(bucket1, bucket2) {
      Store.bucket({ namespace1:bucket1, namespace2:bucket2 }, function(err, storage) {
        storage.put('namespace1', 'key', 'value', function() { /* callback */ });
        storage.put('namespace2', 'key', 'value', function() { /* callback */ });
      });
    });

The pseudo-code above would write the data to different backend stores depending on the name passed in. This way you can set up a global storage object that your entire app can use to interact with storage mechanisms. As long as you keep the same namespaces, you can easily switch out the backend mechanisms.

### Mongo DB

The *URL* parameter to the create function is passed directly to *MongoClient* of the [Native Mongo](https://npmjs.org/package/mongodb) module. To determine which collection to use you need to set *options.collection* or alternatively pass a *collection* query argumet as part of the URL.

    Store('mongodb://localhost:28017/database', { collection:'mycollection' }, function(err, store) { /* callback */ });

or

    Store('mongodb://localhost:28017/database?collection=mycollection', function(err, store) { /* callback */ });

### Riak

    Store('riak://localhost', function(err, store) { /* callback */ }) // Uses a bucket named localhost on the riak-nod on 127.0.0.1
    Store('riak://mybucket', { host:'localhost' }, function(err, store) { /* callback */ })  // Uses a bucket named mybucket on the riak-node on 127.0.0.1
    Store('riak://mybucket', { host:[ 'node1', 'node2', 'node3', 'node4', 'node5' ] }, function(err, store) { /* callback */ })  // Uses a bucket named mybucket on the riak-nodes at node1, node2, node2, node4, and node5.
    Store('riak://mybucket:1234', { host:'localhost' }, function(err, store) { /* callbaack */ }) // Uses port 1234 instead of 8098 to contact your riak nodes


### Amazon S3

    Store('s3://mybucket', { key:'<aws-key>', secret:'<aws-secret>' }, function(err, store) { /* callback */ });

You can also use the options to pass in any knox parameters such as 'region' or 'endpoint'. Be aware that this module sets defaults for

  * *style* = 'virtualHost'
  * *secure* = false

### Level-Up

    Store('levelup:///var/lib/database', function(err, store) { /* callback */ }); // Stores stuff in /var/lib/database

### MemCache

    Store('memcache://localhost:11211', function(err, store) { /* callback */ }); // Uses the memcached at 127.0.0.1:11211
    Store('memcache://my-nick-name', { host:'localhost:11211' }, function(err, store) { /* callback */ }); // Uses the memcached at 127.0.0.1:11211

The stuff in options.host can be any valid definition understood by [MemCacheD](https://npmjs.org/package/memcached)

### Multi

The multi store needs *options.stores* to be an array of objects that look like:

    {
      "url":"<a valid store url>",
      "options": { <matching-store-options> }
    }

These are used to setup the child stores. In addition you can set *options.write* to a number. This will then cause the multi store to only ever try to write data (operations *put* & *delete*) to the first number of stores.

    Store('multi://cached', {
      stores:[
        { url:'memcache://localhost:11211' },
        { url:'s3://mybucket', options:{ key:'<aws-key>', secret:'<aws-secret>' } },
        { url:'mongodb://localhost/mydb?collection=mycollection' }
      ],
      write:2
    }, function(err, store) { /* callback */ });

The pseudo example above will write stuff to memcached and s3, but will read form all three stores. This way you can cache using memcached while writing new data only to s3 but retrieving old data form mongodb if it not yet migrated to s3.

This would be a typical migration scenario to slowly migrate from mongodb to s3.

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
