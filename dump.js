module.exports.dump = function() {

    console.log('data dump begin..')
    var fs = require('fs');
    var mongoClient = require('mongodb').MongoClient;

    namesDBDump();

    function readNames(callback) {
        var names = [];
        var uniqueNames = [];
        fs.readdir('./names/', (err, files)=> {
            if (err) {
                console.error(err);
            }
            var fileCount = 0;
            files.forEach((file)=> {
                fs.readFile('./names/' + file, (err, lines)=> {
                    if (err) {
                        console.error(err);
                    }
                    fileCount++;
                    var year = file.slice(3, 7);
                    var yearNames = lines.toString().split('\n');
                    for (var yearName of yearNames) {
                        if (yearName.length > 1) {
                            var data = yearName.split(',');
                            names.push({
                                year: +year,
                                name: data[0].trim(),
                                gender: data[1].trim(),
                                number: +data[2].trim()
                            });
                            if (uniqueNames[data[0]] != undefined) {
                                uniqueNames[data[0]] += +data[2].trim();
                            } else {
                                uniqueNames[data[0]] = +data[2].trim();
                            }
                        }
                    }
                    if (fileCount === files.length) {
                        callback(names, arrToObjArr(uniqueNames));
                    }
                });
            });
        });
    }

    function arrToObjArr(array) {
        var r = [];
        for (var i in array) {
            r.push({name: i, number: array[i]});
        }
        return r;
    }

    function namesDBDump() {
        mongoClient.connect('mongodb://localhost:27017/popularName', function (err, db) {
            if (err) {
                console.error(err);
            }
            console.log('start cleaning db..');
            db.collection('unique.names').removeMany({}, (err, res)=> {
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
    
};
