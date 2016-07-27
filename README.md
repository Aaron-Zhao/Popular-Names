#Popular Names

Want to see how popular your name is? Check out [here](http://popularnames.herokuapp.com/).

#Data Source

Data used for names in this application is from [data.gov](https://www.data.gov/), which contains all baby names collected by SSA from 1880-2015.

The application can parse data files automatically into MongoDB and JSON files. Query results can be returned by either of them.

#Configuration

- run 'npm install' 
- create directory '/names' and put all source data files in it.
- create directory '/jnames' that will be used to store JSON source files.
- create db 'popularName', collections 'names' and 'unique.names'.
- run 'node -e "require('./dump.js').dump()"' or uncomment last line in index.js file and run next step
- run 'npm start'


#License

This application is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).