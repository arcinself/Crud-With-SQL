const mysql = require('mysql');
let connection;

const connectDb = () => {
    return new Promise((resolve, reject) => {
        connection = mysql.createConnection({
            host : 'localhost',
            user : 'root',
            password : 'Redbottle@321',
            database : 'crud'
        });
        connection.connect(function (err){
            if(err){
                return reject(err);
            }
            return resolve('Successfully connected to the database.');
        });
    });
};

const executeQuery = (query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
            if(err) {
                return reject(err);
            }
            return resolve(result);
        });
    });
};

module.exports = {
    connectDb,
    executeQuery
};