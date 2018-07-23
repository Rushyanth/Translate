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

app.get('/translate/:clang/:slang?',function(req,res){
  myCache.keys(function(err,keys){
        console.log(keys);
      })
  let text = req.query.text;
  let slang = req.params.slang;
  let clang = req.params.clang;
  let cache_key = clang + '_' + text;
  myCache.get(cache_key, function(err,value){
    if(err){
      res.status(500).json({text:'Sorry!! We Encountered an Error',error : err});
    }else if(value){
      res.json({status:'success',translatedText:value});
    }else{
      let url;
      if(slang){
        url = 'https://translation.googleapis.com/language/translate/v2?target=' + clang + '&source=' + slang + '&key=' + config.google_api_key + '&q=' + text;
      }
      else{
        url = 'https://translation.googleapis.com/language/translate/v2?target=' + clang + '&key=' + config.google_api_key + '&q=' + text;
      }
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          data = JSON.parse(body);
          res.json({status:'success',translatedText: data.data.translations[0].translatedText});
          setCache(cache_key,data.data.translations[0].translatedText);
          generateCache(text, clang, slang);
        }
      });
    }
  })
});

function generateCache(text, clang, slang){
  languages = ['kn','hi']
  languages.forEach(function(item){
    cache_key = item + '_' + text;
    myCache.get(cache_key,function(err,value){
      if(!err){
        if(!value){
          let url;
          if(slang !== undefined){
            url = 'https://translation.googleapis.com/language/translate/v2?target=' + clang + '&source=' + slang + '&key=' + config.google_api_key + '&q=' + text;
          }
          else{
            url = 'https://translation.googleapis.com/language/translate/v2?target=' + clang + '&key=' + config.google_api_key + '&q=' + text;
          }
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
