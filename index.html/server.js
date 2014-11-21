var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var config = require('./config.js');
var consolidate = require('consolidate');
var Handlebars = require('handlebars');

var db = require('orchestrate')(config.dbKey);

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.engine('html', consolidate.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/server-templates');

var partials = "./server-templates/partials/";
fs.readdirSync(partials).forEach(function (file) {
  var source = fs.readFileSync(partials + file, "utf8"),
      partial = /(.+)\.html/.exec(file).pop();

  Handlebars.registerPartial(partial, source);
});

// express routes

app.get('/', function (req, res) {
  res.render('./index.html');
});

app.get('/test', function (req, res){
  res.send(200,'testing 1 2 3');
})

app.get('/api/discogsUsers', function (req, res) {
  var rpUsers = [];
  db.list('rpUsers')
  .then(function (result) {
    result.body.results.forEach(function (item){
      rpUsers.push(item.value);
      //console.log(item.value);
    });
    res.json(rpUsers);
    //res.send('hello, this is the discogsUsers route');
  })
  .fail(function (err) {
    console.error(err.body);
  });
});

app.get('/api/discogsUsers/:id', function (req, res) {
  db.get('rpUsers', req.params.id )
  .then(function (result) {
    var user = result.body
    res.json(user);
  })
  .fail(function (err) {
    console.error(err);
  });
});

app.post('/api/discogsUsers', function (req, res){
  req.accepts('application/json');
  var rpUsers = req.body;
  db.put('rpUsers', rpUsers.id, rpUsers.user, false)
  .then(function (){
    res.send(200, 'Welcome Discogs User');
  })
  .fail(function (err) {
    console.error(err.body);
  });
});

app.put('/api/discogsUsers/:id', function (req, response){
  req.accepts('application/json');
  var rpUser = req.body;
  //console.log(rpUser);
  db.search('rpUsers', rpUser.user)
    .then(function (res) {
      //console.log("search response ",res.body);
    if (res.body.count == 0){
      db.put('rpUsers', req.params.id, rpUser, false)
      .then(function (){
        response.send(200, 'Welcome Discogs User');
      })
      .fail(function (err) {
        console.error(err.body);
      });
    }
    }).fail(function (err) {});
    console.log("put response: ",response.body);
  });
  


app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



app.listen(3000,'127.0.0.1', function() {
  console.log('Express server listening on port #3000');
});
