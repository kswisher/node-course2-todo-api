var express = require('express');
var bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {Todo} = require('./models/todo');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

// get all todos
app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

// get a specific todos
app.get('/todos/:id', (req, res) => {
  var id = req.params.id;
  if(!ObjectID.isValid(id)) {
    res.status(404).send();
    return;
  }

  Todo.findById(id).then((todo) => {
    if (todo){
      res.status(200).send({todo});
      return;
    };
    // send not found
    res.status(404).send();
  }).catch((e) => {
    // some sort of error, send bad request
    res.status(400).send();
  });

});

app.listen(port,() => {
  console.log(`Started on port ${port}`);
});


module.exports = {app};
