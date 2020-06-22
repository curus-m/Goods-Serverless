module.exports = {
    getDakiList: "select id, name, brand, price, releaseDate, material, description, image from dakimakura",
    getDakiItem: "select id, name, brand, price, releaseDate, material, description, image from dakimakura where id=$1",
    insertDaki: "",
    insertTest: `insert into human (id, name, age) values(nextval('seqtest'), $1, $2)`
  }
  
  // "insert into dakimakura (no, title, brand, price, releaseDate, material, image, description) "
  // + "values(nextval('goodsseq'),:title, :brand, :price,:releaseDate, :material, :image, :description)"; 