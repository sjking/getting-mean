# Mongo

Connect to mongo command-line:

    $ mongo
    
Listing all local DBs:

	> show dbs
	
Use a specific db:

	> use local
	
Listing collections in db:

	> show collections
	
Seeing the contents of a collection:

	> db.collectionName.find(queryObject)
	
Example:

	> db.locations.find({ "name": "Star Cups" }).pretty()
	
Clear a database:

	> db.locations.remove("")

## Query examples

Finds location with given id, and projects only _id and review field.

	> db.locations.find({ _id: ObjectId('56dccad5e1a03111563fceec') }, { reviews: 1 })
	
	
## Setup on different server

For setting up Mongo on a different VM, edit /etc/mongod.conf, and change the bind address.

# Coordinates

* [-122.968171, 49.28024]
* [-122.918847, 49.279696]

3.578 km apart