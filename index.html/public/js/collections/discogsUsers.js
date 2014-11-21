var Backbone = require('backbone');
var DiscogsUser = require('../models/discogsUser');

var DiscogsUsers = Backbone.Collection.extend({
  model: DiscogsUser,
  url: '/api/discogsUsers',
  comparator: 'creationDate'
});

module.exports = DiscogsUsers;

