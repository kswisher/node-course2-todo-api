const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app}  = require('./../server');
const {Todo} = require('./../models/todo');

// dummy data to load
const todos = [{
  _id: new ObjectID(),
  text: 'First test todo'
}, {
  _id: new ObjectID(),
  text: 'Second test todo',
  completed: true,
  completedAt: 333
}];

// clear the database before any testing
beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
      .post('/todos')
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
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  })
});

describe('GET /todo/:id',() => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 for a bad URL', (done) => {
    request(app)
      .get('/todos/123')
      .expect(404)
      .end(done);
  })
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
      var hexId = todos[0]._id.toHexString();
      request(app)
        .delete(`/todos/${hexId}`)
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

    it('should return 404 if todo not found', (done) => {
      request(app)
        .delete(`/todos/${new ObjectID().toHexString()}`)
        .expect(404)
        .end(done);
    });

    it('should return 400 if objectID is invalid', (done) => {
      request(app)
        .delete(`/todos/1234`)
        .expect(400)
        .end(done);
    });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    // brab id of first item
    // update the text, set completeed to true
    // assert that we get 200
    // text is changed
    // completed is true
    // completedAt is a Number
    var id = todos[0]._id.toHexString();
    var updTodo1 = {
      text: 'Updated text from mocha test',
      completed: true
    };
    request(app)
      .patch(`/todos/${id}`)
      .send(updTodo1)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(updTodo1.text);
        expect(res.body.todo.completed).toBe(true);
      })
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
