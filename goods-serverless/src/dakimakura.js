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
const pageItems = 10;
const s3 = new AWS.S3(s3Config);

const createResponse = (status, body) => ({
    "isBase64Encoded": false,
    "headers": {
        "Content-Type": 'application/json; charset=utf-8', 
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Credentials': true
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
const changeFile = async function (oldFileName) {
    const date = new Date();
    let extension = `${oldFileName.split(".")[1]}`
    let newFileName = `${yyyymmddhhmmss(date)}.${extension}`;
    const copyParams = {
        Bucket: bucketName, 
        Key: `${dakimakuraFolder}${newFileName}`,
        CopySource:  `${bucketName}/${dakimakuraFolder}${oldFileName}`,
        ACL: "public-read"
    }
    s3.copyObject(copyParams, (err, data) => {
            if (err) { 
                console.log(err, err.stack); 
                Promise.reject(err);
            }   
            // an error occurred
            else {
                console.log("Copy complete");
                Promise.resolve(newFileName);
            }
    })
    
}

const deleteFile = function(fileName) {
    const deleteParams = {
        Bucket: bucketName, 
        Key:  `${dakimakuraFolder}${fileName}`,
    }
    
    s3.deleteObject(deleteParams, (err, data) => {
        if (err) { 
            console.log(err, err.stack); // an error occurred
            throw Error(err);
        }
        else {
            console.log("delete Complete")
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
    // console.log(myData);
    console.log("Data OK!");
     
    (async (myData) => {
        const client = await pool.connect()
        const query = queries.addDakimakura
        let fileName = ""; // it is original
        let oldFileName = myData.fileName;
        try {
            if (myData.fileName) { 
                fileName = await changeFile(myData.fileName).then((res)=>{
                    const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, fileName]
                    client.query(query,param).then((result) => {
                        console.log("Successfully added");
                        if (oldFileName != "noimage.jpg") { deleteFile(oldFileName); }
                        callback(null, createResponse(200, { message: 'OK' }))
                    }, (error) => {
                        console.log(error);
                        console.log("Fail!");
                        if (oldFileName != "noimage.jpg") { deleteFile(oldFileName); }
                    })
                }, (error)=>{
                    console.log(error);
                    console.log("Fail!");
                });
            } else { 
                fileName = "noimage.jpg";
                const param = [myData.name, myData.brand, myData.price, myData.releasedate, myData.material, myData.description, fileName]
                client.query(query,param).then((result) => {
                    console.log(result);
                    console.log("Successfully added");
                }, (error) => {
                    console.log(error);
                    console.log("Fail!");
                });
            }
        } finally {
            client.release();
     
        }
    })(myData).catch((err) => {
        console.log(err.stack);
        callback(null, createResponse(404, { message: 'Invalid Data!'}));
    });
    
};
  
exports.getList = (event, ctx, callback) =>  {
    const pages = event.queryStringParameters.page ? event.queryStringParameters.page : 1;
    let searchQuery = event.queryStringParameters.query ? event.queryStringParameters.query : '';
    searchQuery = `%${searchQuery}%`;
    const category = event.queryStringParameters.category ? event.queryStringParameters.category : 0;
    let categoryStart, categoryEnd;
    if( category == 0 )
    {
        categoryStart = 0;
        categoryEnd = 10;
    } else {
        categoryStart = category;
        categoryEnd = category;
    }
    console.log(`page: ${pages} , query: ${searchQuery}, category: ${category}`);
    let offset = pageItems * (pages-1);
    (async () => {
        const client = await pool.connect();
        const dakiListQuery = queries.getDakiList;
        const dakiListParam = [searchQuery, categoryStart, categoryEnd, pageItems, offset];
        const dakiCountQuery = queries.getTotalDakimakura;
        const dakiCountParam = [searchQuery, categoryStart, categoryEnd]
        try {
            const dakiList = await client.query(dakiListQuery, dakiListParam);
            let count = await client.query(dakiCountQuery, dakiCountParam);
            count = Math.ceil(count.rows[0].count/pageItems);
            const data = {
                dakimakuras: dakiList.rows,
                totalPages: count
            }
            callback(null, createResponse(200, data))
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
    const myData = JSON.parse(event.body);
    const isOk = checkData(myData);
    if(!isOk) {
        callback(null, createResponse(404, { message: 'Invalid Data!'}));
    }
    console.log(myData);
    console.log("Data OK!");
   
    (async (myData) => {
        const client = await pool.connect()
        let fileName = ""; // it is original
        let oldFileName = myData.fileName;
        let query, param;
        try {
            if (myData.fileName) { 
                fileName = await changeFile(myData.fileName);
                // image change 
                query = queries.updateDakimakura;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description, fileName];
            } else { 
                // pass image update
                fileName = "noimage.jpg";
                query = queries.updateDakimakuraNoImage;
                param = [myData.id, myData.name, myData.brand, myData.price, myData.material, myData.releasedate, myData.description];
            }
            const res = await client.query(query,param)
            console.log("Update Complete")
            callback(null, createResponse(200, { message: 'OK' }))            
        } finally {
            client.release()
            if (myData.fileName) { deleteFile(oldFileName);}
        }
    })(myData).catch((err) => {
        console.log(err.stack);
        callback(null, createResponse(404, { message: 'Invalid Data!'}));
    });
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