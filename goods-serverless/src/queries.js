const { update } = require("./dakimakura");

module.exports = {
    getDakiList: "select id, name, brand, price, releaseDate, material, description, image from dakimakura order by id desc",
    // limit 10;
    getDakiItem: "select id, name, brand, price, releaseDate, material, description, image from dakimakura where id=$1",
    addDakimakura: `insert into dakimakura (id, name, brand, price, releaseDate, material, image)
                    values(nextval('goodsseq'), $1, $2, $3, $4, $5, $6)`,
    deleteDakimakura: "delete from dakimakura where id = $1",
    updateDakimakura: `update dakimakura set name=$2, brand=$3, price=$4, material=$5,
                      releaseDate=$6, image= $7 where id=$1`,
    updateDakimakuraNoImage: `update dakimakura set name=$2, brand=$3, price=$4, material=$5,
                              releaseDate=$6 where id=$1`,
    getMaterialList: `select name as text, value from material order by value`
  }