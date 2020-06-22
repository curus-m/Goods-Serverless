const { Pool } = require('pg')
const queries = require('./queries.js')
const pool = new Pool()
const createResponse = (status, body) => ({
    "isBase64Encoded": false,
    "headers": {
        "Content-Type": 'application/json; charset=utf-8', 
        'Access-Control-Allow-Origin' : '*'
    },
    "statusCode": status,
    "body": JSON.stringify(body)
 });

exports.create = (event, ctx, callback) => {
    callback(null, createResponse(200, { message: 'create' }));
};
  
exports.getList = (event, ctx, callback) =>  {
    (async () => {
        const client = await pool.connect()
        const query = queries.getDakiList
        try {
            const res = await client.query(query)
            callback(null, createResponse(200, res.rows))
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack))
};
  
exports.getItem = (event, ctx, callback) => {
    const no = event.pathParameters.id
    (async (no) => {
        const client = await pool.connect()
        const query = queries.getDakiItem
        const param = [no]
        try {
            const res = await client.query(query,param)
            console.log(res.rows[0])
            callback(null, createResponse(200, res.rows[0]))
        } finally {
            client.release()
        }
    })(no).catch(err => console.log(err.stack));
};
  
exports.update = (event, ctx, cb) => {
    cb(null, createResponse(200, {message: "test"} ));
};
  
exports.delete = (event, ctx, cb) => {
    cb(null, createResponse(200, { message: 'delete' }));
};

