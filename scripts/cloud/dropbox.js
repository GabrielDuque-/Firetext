/*
* Dropbox Integration
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Variables
------------------------*/
// Namespaces
cloud.dropbox = {};

// Dropbox
var welcomeDropboxArea, welcomeDropboxList, openDialogDropboxArea, openDialogDropboxList;
cloud.dropbox.client = undefined;


/* Auth
------------------------*/
cloud.dropbox.auth = new Dropbox.Client({
  key: "CBB0GYTWGYA=|aeSB7VBcIP94mzfQPoykIzGm++Z97KtaDn2snjXCGQ=="
});

cloud.dropbox.auth.authDriver(new Dropbox.Drivers.Popup({
  rememberUser: true,
  receiverUrl: "http://firetext.codexa.org/auth/success/dropbox/"
}));

cloud.dropbox.auth.onAuth = new CustomEvent('cloud.dropbox.authed');


/* File IO
------------------------*/
cloud.dropbox.enumerate = function (directory, callback) {
  if (directory && cloud.dropbox.client && cloud.dropbox.client.readdir(directory)) {
    var docs = cloud.dropbox.client.readdir(directory, function(error, entries) {
      if (!error) {
        for (var i = 0; i < entries.length; i++) {
          var dir;
          if (directory[directory.length - 1] != '/') {
            dir = (directory + '/');
          } else {
            dir = directory;
          }
          entries[i] = (dir + entries[i]);
          entries[i] = firetext.io.split(entries[i]);
          entries[i].push('');
          
          // Only get documents
          if (entries[i][2] != '.txt' && entries[i][2] != '.html' && entries[i][2] != '.htm') { // 0.4 && entries[i][2] != '.docx') {
            entries.splice(i, 1);
            i = (i - 1);
          }
        }
        // Remove folders
        for (var i = 0; i < entries.length; i++) {
          if (Array.isArray(entries[i]) == false | entries[i][2].length == 1 | entries[i][2][0] != '.') {
            entries.splice(i, 1);
          }
        }
        for (var i = 0; i < entries.length; i++) {
          if (Array.isArray(entries[i]) == false | entries[i][2].length <= 1 | entries[i][2][0] != '.') {
            entries.splice(i, 1);
            i = (i - 1);
          }
        }
        callback(entries);
      } else {
        cloud.dropbox.client.mkdir(directory, function() {
          callback(cloud.dropbox.enumerate(directory, function(l) { return l; }));
        });
      }
    });
  }
};

cloud.dropbox.load = function (path, callback) {
  if (cloud.dropbox.client && path) {
    cloud.dropbox.client.readFile(path, function(e, d) {
      // Hide spinner
      spinner('hide');
          
      // Callback
      if (!e) {
        callback(d);
      } else {
        callback(e.status, true);
      }
    });
  } else {
    // Hide spinner
    spinner('hide');
          
    // Callback error
    if (!cloud.dropbox.client) {
      callback(_('not-signed-in'), true);
    } else if (!path) {
      callback(_('path-not-defined'), true);
    } else {
      callback(_('unknown-error'), true);
    }
  }
}

cloud.dropbox.save = function (path, content, showSpinner, callback) {
  if (cloud.dropbox.client && path && content) {
    if (showSpinner == true) {
      spinner();
    }
    cloud.dropbox.client.writeFile(path, content, function() { 
      if (showSpinner == true) {
        spinner('hide');
      }
      callback();
    });    
  } else {
    if (!cloud.dropbox.client) {
      callback(_('not-signed-in'));
    } else if (!path) {
      callback(_('path-not-defined'));
    } else if (!content) {
      callback(_('content-not-defined'));
    } else {
      callback(_('unknown-error'));
    }
  }
}

cloud.dropbox.delete = function (path) {
  if (cloud.dropbox.client && path) {
    cloud.dropbox.client.remove(path, function(e) { });
  } else {
    if (!cloud.dropbox.client) {
      return _('not-signed-in');
    } else if (!path) {
      return _('path-not-defined');
    } else {
      return _('unknown-error');
    }
  }
}


/* Misc
------------------------*/
cloud.dropbox.error = function (error) {
  switch (error.status) {
  case Dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    alert(_('dropbox-full'));
    break;


  case Dropbox.ApiError.NETWORK_ERROR:
    alert(_('network-error'));
    break;

  case Dropbox.ApiError.RATE_LIMITED:
  case Dropbox.ApiError.INVALID_TOKEN:
  case Dropbox.ApiError.INVALID_PARAM:
  case Dropbox.ApiError.OAUTH_ERROR:
  case Dropbox.ApiError.INVALID_METHOD:    
  case 404:  
  default:
    // TBD Code to Notify Fireanalytic
    break;
  }
};
