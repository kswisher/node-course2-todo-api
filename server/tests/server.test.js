const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app}  = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

console.log('attempting to seed data');
describe('seed the data', function () {
  this.timeout(5000);

beforeEach(populateUsers);
beforeEach(populateTodos);
describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err){
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err,res) => {
        if(err){
          return done(err);
        }

        Todo.find({}).then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });

});
describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  })
});

describe('GET /todo/:id',() => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should not return todo doc for another user', (done) => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for a bad URL', (done) => {
    request(app)
      .get('/todos/123')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  })
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
      var hexId = todos[0]._id.toHexString();
      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo._id).toBe(hexId);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          // query database to make sure it got deleted
          Todo.findById(hexId).then((todo) => {
            expect(todo).toBe(null);
            done();
          }).catch((e) => {
            done(e);
          });
        });
    });

    it('should not remove a todo for another user', (done) => {
      var hexId = todos[1]._id.toHexString();
      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          // query database to make sure it got deleted
          Todo.findById(hexId).then((todo) => {
            expect(todo).not.toBe(null);
            done();
          }).catch((e) => {
            done(e);
          });
        });
    });

    it('should return 404 if todo not found', (done) => {
      request(app)
        .delete(`/todos/${new ObjectID().toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 400 if objectID is invalid', (done) => {
      request(app)
        .delete(`/todos/1234`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(400)
        .end(done);
    });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    var id = todos[0]._id.toHexString();
    var updTodo1 = {
      text: 'Updated text from mocha test',
      completed: true
    };
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .send(updTodo1)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(updTodo1.text);
        expect(res.body.todo.completed).toBe(true);
      })
      .end(done);
  });

  it('should NOT update the todo owned by another user', (done) => {
    var id = todos[1]._id.toHexString();
    var updTodo1 = {
      text: 'Updated text from mocha test',
      completed: true
    };
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .send(updTodo1)
      .expect(404)
      .end(done);
  });

  it('should clear completedAt when todo is not completed', (done) => {
    // grab id of secnod item
    // update text, set completed to false
    // 200
    // text is changed, completed false, campletedat is false
    var id = todos[1]._id.toHexString();
    var updTodo1 = {
      text: 'Updated text from mocha test2',
      completed: false
    };
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(updTodo1)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(updTodo1.text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBe(null);
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });
  it('should return 401 if not authorized', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123abc!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        });
      });
  });
  it('should return validation errors if invalid email or password', (done) => {
    var email = 'bobdontlikeemail';
    var password = '12';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });
  it('should not create a user if email is not unique', (done) => {
    var email = users[0].email;
    var password = 'abc123';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });

  describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
      request(app)
        .post('/users/login')
        .send({
          email: users[1].email,
          password: users[1].password
        })
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-auth']).toBeTruthy();
        })
        .end((err,res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[1]._id).then((user) => {
            expect(user.tokens[1].toObject()).toHaveProperty('access', 'auth');
            expect(user.tokens[1].toObject()).toHaveProperty('token', res.headers['x-auth']);
            done();
          }).catch((e) => done(e));
        });
    });
    it('should reject invalid login', (done) => {
      request(app)
        .post('/users/login')
        .send({
          email: users[1].email,
          password: 'blahskjdfkjdkfaj'
        })
        .expect(400)
        .expect((res) => {
          expect(res.headers['x-auth']).not.toBeTruthy();
        })
        .end((err,res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[1]._id).then((user) => {
            expect(user.tokens.length).toBe(1);
            done();
          }).catch((e) => done(e));
        });
    });

  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    // delete /users/me/token
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err,res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
    // set x-atuh equal to token
    // 200
    // find user, verify that tokens array has length of 0
  });
});

});
