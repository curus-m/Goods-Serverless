const createResponse = (status, body) => ({
    statusCode: status,
    body: JSON.stringify(body)
  });
  
// 스토리 만들기
exports.create = (event, ctx, cb) => {
    cb(null, createResponse(200, { message: 'DakiInfo created' }));
};
  
exports.getList = (event, ctx, cb) => {
    cb(null, createResponse(200, { message: 'list' }));
};
  
exports.getItem = (event, ctx, cb) => {
    cb(null, createResponse(200, { message: 'read' }));
};
  
exports.update = (event, ctx, cb) => {
    cb(null, createResponse(200, { message: 'update' }));
};
  
exports.delete = (event, ctx, cb) => {
    cb(null, createResponse(200, { message: 'delete' }));
};