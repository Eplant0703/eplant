"use strict";
var CACHE = "eplant-voca-v37";
var SHELL = ["./index.html", "./manifest.json", "./logo-wide.png", "./symbol.png",
             "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon.png"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(SHELL.map(function(u){
      return c.add(u).catch(function(){});
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){
      return k === CACHE ? null : caches.delete(k);
    }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  // 학생 명단과 관리자 화면은 저장해두지 않는다
  var isRoster = /students\.json|admin\.html/.test(url.pathname);
  if(isRoster){
    e.respondWith(fetch(req));
    return;
  }
  var isJson = /\.json($|\?)/.test(url.pathname + url.search);

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req, {ignoreSearch:true}).then(function(hit){
        if(hit) return hit;
        return isJson ? Response.error() : caches.match("./index.html");
      });
    })
  );
});
