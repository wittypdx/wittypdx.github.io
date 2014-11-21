var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var discogsUser = Backbone.Model.extend({
  urlRoot: '/api/discogsUsers'
});

module.exports = discogsUser;

