var srcWithCookies = [];
var srcWithoutCookies = [];
var cacheWithCookies = {};
var cacheWithoutCookies = {};

//struction is {url: isSame, ...}
var compareResults = {};

Array.prototype.in_array = function(e) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == e) {
            return true;
        }
    }
    return false;
}

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

function removeCookie(cookie) {
  var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
            cookie.path;
  chrome.cookies.remove({"url": url, "name": cookie.name});
}

function getResource(url, withCookies) {
    var x = new XMLHttpRequest();
    x.open('GET', url);
    x.responseType = 'document';
    x.onload = function() {
        var scripts = x.response.getElementsByTagName('script');
        //scripts = x.response.all.tags('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            console.log(src);
            if (src != null) {
                if (withCookies) {
                    if (!srcWithCookies.in_array(src))
                        //srcWithCookies[srcWithCookies.length] = src;
                        cacheWithCookies[src] = null;
                } else {
                    if (!srcWithoutCookies.in_array(src))
                        //srcWithoutCookies[srcWithoutCookies.length] = src;
                        cacheWithoutCookies[src] = null;
                }
            }
        }
    };
    x.onerror = function() {
        console.log('Network error.');
    };
    x.send();
}

function get() {
    getCurrentTabUrl(function(url) {
        var x = new XMLHttpRequest();
        x.open('GET', url);
        x.responseType = 'document';
        x.onload = function() {
            var scripts = x.response.getElementsByTagName('script');
            console.log(x.response);
            //scripts = x.response.all.tags('script');
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].getAttribute('src');
                console.log(src);
                if (src != null && !srcWithCookies.in_array(src)) {
                    srcWithCookies[srcWithCookies.length] = src;
                    cacheWithCookies[src] = null;

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', src);
                    xhr.responseType = 'text';
                    xhr.onload = function(e) {
                        cacheWithCookies[e.target.responseURL] = e.target.responseText;
                    };
                    xhr.send();
                }
            }
        };
        x.send();
    });
    
}

function delCookie() {
    getCurrentTabUrl(function(url){
        chrome.cookies.getAll({'url': url}, function(cookies){
            for(var i in cookies) {
                removeCookie(cookies[i]);
            }
        });
    });
}

function getJsResource(url, withCookies) {
    var x = new XMLHttpRequest();
    x.open('GET', url);
    x.responseType = 'text';
    x.onload = function() {
        if (withCookies) {
            cacheWithCookies[cacheWithCookies.length] = x.response;
        } else {
            cacheWithoutCookies[cacheWithoutCookies.length] = x.response;
        }
    };
    x.onerror = function() {
        console.log('Network error.');
    };
    x.send();
}

function getAgain() {
    getCurrentTabUrl(function(url){
        var x = new XMLHttpRequest();
        x.open('GET', url);
        x.responseType = 'document';
        x.onload = function() {
            var scripts = x.response.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].getAttribute('src');
                console.log(src);
                if (src != null && !srcWithoutCookies.in_array(src)) {
                    srcWithoutCookies[srcWithoutCookies.length] = src;
                    cacheWithoutCookies[src] = null;

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', src);
                    xhr.responseType = 'text';
                    xhr.onload = function(e) {
                        cacheWithoutCookies[e.target.responseURL] = e.target.responseText;
                    };
                    xhr.send();
                }
            }
        };
        x.send();
    });
}

function compare() {
    compareResults = [];
    for (var i in cacheWithCookies) {
        for (var j in cacheWithoutCookies) {
            if (i == j) {
                var isSame = (cacheWithCookies[i] == cacheWithoutCookies[j] ? true : false);
                compareResults[i] = isSame;
            }
        }
    }
    console.log(compareResults);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('delCookie').addEventListener('click', delCookie);
});


