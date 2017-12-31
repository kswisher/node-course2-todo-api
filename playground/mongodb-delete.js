const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, database) => {
  if (err) {
    return console.log('Unable to connect to mongodb server');
  }
  //console.log(database);
  const db = database.db('TodoApp');

  console.log('Connected to mongodb server');

  // delete many
  // db.collection('Todos').deleteMany({text:'Eat Lunch'}).then((results)=>{
  //   console.log(results);
  // });

  // delete insertOne
  // db.collection('Todos').deleteOne({text:'Eat Lunch'}).then((results)=>{
  //   console.log(results);
  // });

  // find and delete
  db.collection('Todos').findOneAndDelete({completed:false}).then((results)=>{
    console.log(results);
  });



  database.close();
});
