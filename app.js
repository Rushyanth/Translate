var express = require('express');
var http = require('http');
var request = require('request');
var config = require('./config.js');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

let app = express();

app.get('/',function(req,res) {
  res.json({'status' : 'success'});
});

app.get('/translate/:lang',function(req,res){
  myCache.keys(function(err,keys){
        console.log(keys);
      })
  let text = req.query.text;
  let lang = req.params.lang;
  let cache_key = lang + '_' + text;
  myCache.get(cache_key, function(err,value){
    if(err){
      res.status(500).json({text:'Sorry!! We Encountered an Error',error : err});
    }else if(value){
      res.json({status:'success',translatedText:value});
    }else{
      let url = 'https://translation.googleapis.com/language/translate/v2?target='+lang+'&key='+config.google_api_key+'&q='+text;
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          data = JSON.parse(body);
          console.log(data)
          res.json({status:'success',translatedText: data.data.translations[0].translatedText});
          setCache(cache_key,data.data.translations[0].translatedText);
          generateCache(text);
        }
      });
    }
  })
});

function generateCache(text){
  languages = ['kn','hi']
  languages.forEach(function(item){
    cache_key = item+'_'+text;
    myCache.get(cache_key,function(err,value){
      if(!err){
        if(!value){
          let url = 'https://translation.googleapis.com/language/translate/v2?target='+item+'&key='+config.google_api_key+'&q='+text;
          request(url, function(){
            var key = cache_key;
            return function (error, response, body) {
            if (!error && response.statusCode == 200) {
              data = JSON.parse(body);
              setCache(key,data.data.translations[0].translatedText);
            }
          }}());
        }
      }
    })
  })
}

function setCache(key,value){
  myCache.set(key,value,function(err,success){
    if(!err && success){
      console.log("Successfully Cached")
    }
  })
}
http.createServer(app).listen(3000);
console.log("Server is running....");
