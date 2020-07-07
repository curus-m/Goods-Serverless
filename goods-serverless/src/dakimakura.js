const AWS = require('aws-sdk');
const { Pool } = require('pg')
const queries = require('./queries.js')
const pool = new Pool()
const bucketName = "goods-resources";
const dakimakuraFolder = "resources/dakimakura/";
const s3Config = {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: 'ap-northeast-1',
    signatureVersion: 'v4'
}

const createResponse = (status, body) => ({
    "isBase64Encoded": false,
    "headers": {
        "Content-Type": 'application/json; charset=utf-8', 
        'Access-Control-Allow-Origin' : '*'
    },
    "statusCode": status,
    "body": JSON.stringify(body)
 });

const checkData  = function(data) {
    const errors = [];

    if(!data.name) {
        errors.push("Name Error");
    }
    if (!data.brand) {
        errors.push("Brand Error");
    }
    if (isNaN(data.price)) {
        errors.push("Name Error");
    }
    if (isNaN(data.material)) {
        errors.push("Material Error");
    }
    if (!data.releasedate) {
        errors.push("Date Error");
    }
    console.log("errors:" + errors);
    return errors.length > 0 ? false : true;
}
// change fileName on s3 
const changeFileName = function (oldFileName) {
    const date = new Date();

    let newFileName = yyyymmddhhmmss(date);
    console.log(`filename : ${newFileName}`);
    const s3 = new AWS.S3(s3Config);
    const copyParams = {
        Bucket: bucketName, 
        CopySource:  `${dakimakuraFolder}${oldFileName}`,
        Key: `${dakimakuraFolder}${newFileName}`
        //resources/dakimakura/20190613222957.jpg
    }
    const deleteParams = {
        Bucket: bucketName, 
        Key:  `${dakimakuraFolder}${oldFileName}`,
    }
    s3.copyObject(copyParams, (err, data) => {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);   
    })
    // (from_bucket, object_key, to_bucket, object_key); 
    // deleteObject(params = {}, callback) ⇒ AWS.Request 
    // delete original file
    s3.deleteObject(deleteParams, (err, data) => {
        if (err) { 
            console.log(err, err.stack); // an error occurred
            return null;
        }
        else     console.log(data);   
    });
    return newFileName;
}

const deleteFile = function(filename) {
    const s3 = new AWS.S3({region: 'ap-northeast-1'});
    const params = {Bucket: 'resources/dakimakura/', Key: filename};
    s3.deleteObject (params, function (err, data) {
        if (err) {
            console.log("Error", err);
            throw Error(err);
        } 
        if (data) {
            console.log("Upload Success", data.Location);
        }
    });
}
 const yyyymmddhhmmss = function(date) {
    var yyyy = date.getFullYear();
    var mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
    var dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss);
};
 
exports.create = (event, ctx, callback) => {
    const myData = JSON.parse(event.body);
    const isOk = checkData(myData);
    if(!isOk) {
        callback(null, createResponse(404, { message: 'Invalid Data!'}));
    }
    console.log(myData);
    console.log("Data OK!")

    (async (myData) => {
        const client = await pool.connect()
        const query = queries.addDakimakura
        let filename = ""; // it is original
        try {
            if (myData.fileName) { 
                filename = changeFileName(filename);
            } else { 
                filename = "noimage.jpg";
            }
            const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, filename]
            const res = await client.query(query,param)
            console.log("Successfully added");
            callback(null, createResponse(200, { message: 'OK' }))            
        } finally {
            client.release()
        }
    })(myData).catch(err => console.log(err.stack));
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
    const no = event.pathParameters.id;
    
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
  
exports.update = (event, ctx, callback) => {
    const data =  JSON.parse(event.body.data);
    const file = event.body.file;
    const isOk = checkData(data);
    if(!isOk) {
        callback(null, createResponse(404, { message: 'Invalid Data!' }));
    }
    console.log("Data OK!");
    (async (data,file) => {
        const client = await pool.connect();
        const date = new Date();
        let filename = data.image;
        try {
            if (file) {
                changeFileName(filename);
            }
            const query = queries.updateDakimakura;
            const param = [data.id, data.name, data.brand, data.price, data.material, data.releasedate, data.image];
            const res = await client.query(query,param)
            console.log("Update Complete")
            callback(null, createResponse(200, { message: 'OK' }))            
        } finally {
            client.release()
        }
    })(data, file).catch(err => console.log(err.stack));    
   

};
  
exports.delete = (event, ctx, callback) => {
    const no = event.body.id;
    (async (no) => {
        const client = await pool.connect()
        const query = queries.deleteDakimakura
        const param = [no]
        try {
            const res = await client.query(query,param)
            console.log(res.rows[0])
            callback(null, createResponse(200, { message: 'OK' }))            
        } finally {
            client.release()
        }
    })(no).catch(err => console.log(err.stack));
};

exports.getMaterials = (event, ctx, callback) => {
    (async () => {
        const client = await pool.connect()
        const query = queries.getMaterialList;
        try {
            const res = await client.query(query);
            callback(null, createResponse(200, res.rows));
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack));
}

exports.getPreSignedURL = function(event, context, callback) {
    let requestObject = JSON.parse(event["body"]);
    const s3 = new AWS.S3(s3Config);
    const fileName = requestObject.fileName;
    const param = {
      Bucket: bucketName,
      Key: `${dakimakuraFolder}${fileName}`,
      Expires: 600
    };
    console.log("param: " + JSON.stringify(param));
    s3.getSignedUrl('putObject', param , function (err, url) {
      if (err) {
        console.log("error: " + err);
        callback(null, createResponse(500, err));
      } else {
        callback(null,createResponse(200, url));    
      }
    });
};