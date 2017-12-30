const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, database) => {
  if (err) {
    return console.log('Unable to connect to mongodb server');
  }
  //console.log(database);
  const db = database.db('TodoApp');

  console.log('Connected to mongodb server');
  // console.log(JSON.stringify(err, undefined, 2));
  // console.log(JSON.stringify(db, undefined, 2));
  //console.log('should of seen something above.')
  // db.collection('Todos').insertOne({
  //   text: 'Something to do',
  //   completed: false
  // }, (err, res) => {
  //   if (err){
  //     return console.log('Unable to insert todo', err);
  //   }
  //   console.log(JSON.stringify(res.ops, undefined, 2));
  //
  // });

  // insert someonie into Users collection
  db.collection('Users').insertOne({
    name: 'Ken',
    age: 41,
    location: 'Lees Summit, MO 64086'
  }, (err, res) => {
    if (err) {
      return console.log('Unable to insert Users');
    }
    console.log(JSON.stringify(res.ops, undefined, 2));

  });

  database.close();
});
