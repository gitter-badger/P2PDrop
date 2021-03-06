import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('home');
  this.route('about');
  this.route('people', function () {
    this.route('find');
    this.route('detail');
  });
  this.route('users');
  this.route('signup');
  this.route('signin', {path : "/"});
  this.route('notifications');
  this.route('profile');
});

export default Router;
