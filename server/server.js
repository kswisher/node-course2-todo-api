require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {Todo} = require('./models/todo');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

// get all todos
app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

// get a specific todos
app.get('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  if(!ObjectID.isValid(id)) {
    res.status(404).send();
    return;
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
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

app.delete('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  if(!ObjectID.isValid(id)) {
    res.status(400).send();
    return;
  }

  Todo.findOneAndRemove({
    _id:id,
    _creator: req.user._id
  }).then((todo) =>{
    if(todo){
      res.status(200).send({todo});
      return;
    }
    // not found
    res.status(404).send();
  }).catch((e) => {
    res.status(400).send();
  });
});

app.patch('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  // invalid objectid, return bad request
  if (!ObjectID.isValid(id)){
    res.send(400).send();
    return;
  }

  // handle completed Boolean
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.compeleted = false;
    body.completedAt = null;
  };

  Todo.findOneAndUpdate({
    _id:id,
    _creator:req.user._id
  }, {$set: body},
  {new:true})
  .then((todo) => {
    if (todo){
      res.status(200).send({todo});
    }

    // not found
    res.status(404).send();
  }).catch((e) => {
    res.status(400).send();
  });

});

app.post('/users', (req, res) => {
  var reqUser = _.pick(req.body,['email', 'password']);
  var user = new User({
    email: reqUser.email,
    password: reqUser.password
  });

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
  // pick the email and password off
  var body = _.pick(req.body, ['email','password']);
  // find the user
  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

app.listen(port,() => {
  console.log(`Started on port ${port}`);
});


module.exports = {app};
