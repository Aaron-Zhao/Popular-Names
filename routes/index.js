var express = require('express');
var fs = require('fs');
var mongoClient = require('mongodb').MongoClient;
var router = express.Router();
var uniqueNamesObj = JSON.parse(fs.readFileSync('./jnames/unique_names.json', 'utf8'));
var namesObj = JSON.parse(fs.readFileSync('./jnames/names.json', 'utf8'));

function readNames(callback) {
  var names = [];
  var uniqueNames = [];
  fs.readdir('./names/', (err, files)=> {
    if (err) { console.error(err);}
    var fileCount = 0;
    files.forEach((file)=> {
      fs.readFile('./names/'+file, (err, lines)=> {
        if (err) { console.error(err);}
        fileCount++;
        var year = file.slice(3, 7);
        var yearNames = lines.toString().split('\n');
        for(var yearName of yearNames){
          if(yearName.length>1){
            var data = yearName.split(',');
            names.push({
              year: +year,
              name: data[0].trim(),
              gender: data[1].trim(),
              number: +data[2].trim()
            });
            if(uniqueNames[data[0]]!=undefined){
              uniqueNames[data[0]] += +data[2].trim();
            }else{
              uniqueNames[data[0]] = +data[2].trim();
            }
          }
        }
        if(fileCount===files.length){
          callback(names, arrToObjArr(uniqueNames));
        }
      });
    });
  });
}

function arrToObjArr(array){
  var r = [];
  for(var i in array) {
    r.push({name: i, number: array[i]});
  }
  return r;
}

function namesDBDump() {
  mongoClient.connect('mongodb://localhost:27017/popularName', function(err, db) {
    if (err) { console.error(err);}
    console.log('start cleaning db..');
    db.collection('unique.names').removeMany({},(err, res)=> {
      db.collection('names').removeMany({}, (err, res)=> {
        console.log('end cleaning db..');
        console.log('start reading names..');
        readNames((names, uniqueNames)=> {
          console.log('end reading names..');
          console.log('start writing names to db..');
          writeNameFiles('names.json', JSON.stringify(names));
          writeNameFiles('unique_names.json', JSON.stringify(uniqueNames));
          db.collection('names').insertMany(names, (err, res)=> {
            console.log('end writing names to db.names..');
            db.collection('unique.names').insertMany(uniqueNames, (err, res)=> {
              console.log('end writing names to db.unique.names..');
              console.log('end writing names to db..');
              db.close();
            });
          });
        });
      });
    });
  });
}

function writeNameFiles(fileName, data){
  fs.writeFile("./jnames/"+fileName, data, function(err) {
    if(err) {
      return console.log(err);
    }
  });
}

function getNames(table, selection, sort, callback){
  var r = [];
  mongoClient.connect('mongodb://localhost:27017/popularName', function(err, db) {
    if (err) { console.error(err);}
    db.collection(table).find(selection).sort(sort).each((err, doc)=> {
      if(doc!=null){
        doc.number = formatNum(doc.number);
        r.push(doc);
      }else{
        callback(r);
        db.close();
      }
    });
  });
}

function getPopularYear(name, sort, callback){
  var r = [];
  mongoClient.connect('mongodb://localhost:27017/popularName', function(err, db) {
    if (err) { console.error(err);}
    db.collection('names').find({name: name}).sort(sort).each((err, doc)=> {
      if(doc!=null){
        doc.number = formatNum(doc.number);
        r.push(doc);
      }else{
        callback([r[0]]);
        db.close();
      }
    });
  });
}

function formatNum(num){
  var s = num.toString();
  var number = '';
  for(var i=(s.length-1);i>-1;i--){
    number = s[i] + number;
    if((s.length-i)%3===0&&i!==0){
      number = ',' + number;
    }
  }
  return number;
}

function getNamesLocal(type, selection, sort, callback) {
  if(type==='names'){

  }else{
    for(var name of uniqueNamesObj){
      if(name.name===selection.name){
        var n = Object.assign({}, name); //shallow copy
        n.number = formatNum(n.number);
        callback([n]);
        return;
      }
    }
  }
  callback([]);
}

function getPopularYearLocal(name, sort, callback) {
  var r = [];
  for(var nameObj of namesObj){
    if(nameObj.name===name){
      var n = Object.assign({}, nameObj);
      if(r.length>0){
        if(r[0].number<n.number){
          r.unshift(n);
        }else{
          r.push(n);
        }
      }else{
        r.push(n);
      }
    }
  }
  r[0].number = formatNum(r[0].number);
  callback([r[0]]);
}

function getTodayLocal(callback){
  var r = [];
  for(var nameObj of namesObj){
    if(nameObj.year===2015 && nameObj.number>=10000) {
      var n = Object.assign({}, nameObj);
      if (r.length > 0) {
        if (r[0].number < n.number) {
          r.unshift(n);
        } else {
          r.push(n);
        }
      } else {
        r.push(n);
      }
    }
  }
  for(var ro of r) { ro.number = formatNum(ro.number);}
  callback(r);
}

function getAllTimeLocal(callback){
  var r = [];
  for(name of uniqueNamesObj){
    if(name.number>=1000000){
      var n = Object.assign({}, name);
      if (r.length > 0) {
        if (r[0].number < n.number) {
          r.unshift(n);
        } else {
          r.push(n);
        }
      } else {
        r.push(n);
      }
    }
  }
  for(var ro of r) { ro.number = formatNum(ro.number);}
  callback(r);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  // namesDBDump();
  res.render('index', { title: 'Popular Names' });
});

router.get('/search/:name', function(req, res, next) {
  var name = req.params.name;
  name = name.charAt(0).toUpperCase() + name.substr(1);
  console.log('search name: '+ name);
  getNamesLocal('unique.names', {name: name}, {number: -1}, (totalNamed)=> {
    if(totalNamed.length!==0) {
      getPopularYearLocal(name, {number: -1}, (popularYear)=> {
        res.render('result', {title: 'Popular Names', totalNamed: totalNamed, popularYear: popularYear});
      });
    }else{
      res.render('result', {title: 'Popular Names', totalNamed: totalNamed});
    }
  });
});

router.get('/today', function(req, res, next) {
  getTodayLocal((names)=> {
    res.render('today', { title: 'Popular Names', names: names });
  });
  // getNames('names', {$and: [{year: 2015}, {number: {$gte: 10000}}]}, {number: -1}, (names)=> {
  //   res.render('today', { title: 'Popular Names', names: names });
  // });
});

router.get('/allTime', function(req, res, next) {
  getAllTimeLocal((names)=> {
    res.render('allTime', { title: 'Popular Names', names: names });
  });
  // getNames('unique.names', {number: {$gte: 1000000}}, {number: -1}, (names)=> {
  //   res.render('allTime', { title: 'Popular Names', names: names });
  // });
});

module.exports = router;
