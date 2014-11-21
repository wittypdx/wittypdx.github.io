var Backbone = require('backbone');
var http = require('http');
var url = require('url');
var request = require('request');

Backbone.$ = $;

var htmlTemplate = require('../../templates/main.hbs');
var loginHTML = require('../../templates/login.hbs');

var MainView = Backbone.View.extend({
  el: '#my-app',

  events: {
    'click #username-submit': 'addUsername'
  },
  records: {releases:[], pages:[]},
  
  //testThing: {wants:[{discogs: 5719574, youtube: "QLnTRwpmCGs"}, {discogs: 4368235, youtube: "zH1VeQFBfW8"}]},

  addUsername: function() {
      var self = this;
      var $user = $('.username-form').find('#username');
      var userName = $user.val();
      $.getJSON('http://api.discogs.com/users/'+userName+'?callback=?')
        .always(function(data){
         // console.log("success");
        if (data.data.num_wantlist == undefined){
            alert("Please go to discogs.com and share (and/or) populate your wantlist to use this site!");
          }else if (data.data.num_wantlist == 0){
            alert("Please go to discogs.com and put a record or two in your wantlist!");
          }else{
            self.userName = userName;
            self.currentList = "wantlist";
            self.currentPage = 1;
            self.discogs(self.userName, self.currentList, self.currentPage);
            
          var date = Date.now();
          var collectionFromInput = {
            user: userName,
            creationDate: date,
            id: 'user' + date
          };
          if (self.collection.where({user:userName}).length == 0){
          self.collection.create( collectionFromInput );}
          //console.log(self.collection.models);
          //console.log(userName)
          }
      }).fail(function(event, jqxhr, exception) {

              if (jqxhr.status == 404) {
              console.log("user doesn't exist");   
              }
          });
  },

  initialize: function (options) {
      this.userName = options.user;
      this.currentList = options.list;
      this.currentPage = options.page;
      this.collection = options.collection;
      this.collection.fetch();

  },

  login: function (options) {
    if (options.user == undefined){
      $(this.el).html(loginHTML());
    }else{
      this.userName = options.user;
      this.currentList = options.list;
      this.currentPage = options.page;
      this.discogs(this.userName, this.currentList, this.currentPage);
    }

  },

  discogs: function(user, list, page){ //list needs to be "wants" or "collection"
    this.records = {releases:[], pages:[]};
    //console.log("from discogsfn top - list = "+list);
    var self = this;
    //var wantList = {};
    var pages = undefined;
    var relArr = [];
    var animationHtml = "<div class='spinner'></div>";
    $(".lazy-wrapper").replaceWith(animationHtml); //loading status thing
    $("#status").replaceWith(animationHtml);

    var getIds = function(list, callback, page){ //gets every release id in users wantlist and passes as an array to getVids function
      if (list == "wantlist"){
        var apiCall = 'http://api.discogs.com/users/'+user+'/wants?page='+page+'&callback=?';
      }else if (list == "collection"){
        var apiCall = 'http://api.discogs.com/users/'+user+'/collection/folders/0/releases?page='+page+'&callback=?';
      }
      self.currentPage = page;
      //console.log("api call = "+apiCall);
      $.getJSON(apiCall)
        .done(function(data){ //this returns JSONP handled in a callback. Need to traverse an extra data (data.data). property to get to the stuff we care about
          var data = data;
          if(list == "wantlist"){
            var arr = data.data.wants;
          }else if(list == "collection"){
            var arr = data.data.releases;
          } 
          pages = data.data.pagination.pages;
                if (self.currentPage == 1){
                    self.prevPage = 1;
                    self.nextPage = 2;
                  }
                else if (self.currentPage == pages){
                    self.prevPage = parseInt(self.currentPage)-1;
                    self.nextPage = self.currentPage;
                  }
                else {
                    self.nextPage = parseInt(self.currentPage)+1;
                    self.prevPage = parseInt(self.currentPage)-1;
                  };
          arr.forEach(function (item, index){ //this grabs the discogs id of every release in the array
            relArr.push(item.id);
          });
          for (var i = 0; i<pages; i++){ //fills the pages array with the api returned pagination numbers
            self.records.pages.push({page:i+1, user:user, list:list});
          };           
            callback(relArr);
           
        }).fail(function() {
          console.log( "get page "+page+" of "+user+"'s "+list+" from discogs failed" );
          });
    };

    var getVids = function(arr){  //grabs youtube video per release in wantArr from getIds fn
      arr.forEach(function (item, index){
        $.getJSON('http://api.discogs.com/releases/'+item+'?callback=?').done(function(rels){
          if (rels.data.videos){
          self.records.releases.push({youtube:rels.data.videos[0].uri.slice(-11), discogs:item, artist:rels.data.artists[0].name, title:rels.data.title}); //this adds objects for everything fetched from discogs to the records array
         }
         if (index == arr.length-1){
         self.render({
          releases:self.records.releases, 
          pages:self.records.pages, 
          user:self.userName, 
          list:self.currentList, 
          first:1, 
          last:self.records.pages.length,
          prev:self.prevPage,
          next:self.nextPage
        });
         }
        }); 
      });
    };
  getIds(list, getVids, page);
  },

    

  render: function (template) {
    $(this.el).html(htmlTemplate(template));
    $('.js-lazyYT').lazyYT(); 
    this.collection.each(function(item){
      //console.log(item.get("user"));
      var Duser = item.get("user");
      var html = "<li role='presentation'><a role='menuitem' tabindex='-1' href='#/"+Duser+"/wantlist/1'>"+Duser+"</a></li>";
      $(".dropdown-menu").append(html);
    })
   // $(this.el).html(myTemplate({entries:[{youtube: data, discogs: data},{...}]}))
  }

});


module.exports = MainView;
