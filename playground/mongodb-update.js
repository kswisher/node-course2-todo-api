const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, database) => {
  if (err) {
    return console.log('Unable to connect to mongodb server');
  }
  //console.log(database);
  const db = database.db('TodoApp');

  console.log('Connected to mongodb server');

  db.collection('Todos').findOneAndUpdate({
    _id: new ObjectID("5a4902403e3bf862f22bdad0")
  }, {
    $set: {completed: true}
  }, {
    returnOriginal: false
  }).then((err, result) => {
    if (err){
      return console.log(err);
    }
    console.log(results);
  });

  database.close();
});
