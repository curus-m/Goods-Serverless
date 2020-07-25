const { update } = require("./dakimakura");

module.exports = {
    getDakiList: "select id, name, image from dakimakura where name like $1 and material between $2 and $3 order by id desc limit $4 offset $5",
    getDakiItem: "select dakimakura.id, dakimakura.name, dakimakura.brand,  dakimakura.price, to_char( dakimakura.releaseDate, 'YYYY-MM-DD') as releasedate, material.name as material,  dakimakura.description,  dakimakura.image from dakimakura, material where dakimakura.id=$1 and dakimakura.material = material.value;",
    getTotalDakimakura: "select count(*) from dakimakura where name like $1 and material between $2 and $3",
    addDakimakura: `insert into dakimakura (id, name, brand, price, releaseDate, material, image)
                    values(nextval('goodsseq'), $1, $2, $3, $4, $5, $6)`,
    deleteDakimakura: "delete from dakimakura where id = $1",
    updateDakimakura: `update dakimakura set name=$2, brand=$3, price=$4, material=$5,
                      releaseDate=$6, image= $7 where id=$1`,
    updateDakimakuraNoImage: `update dakimakura set name=$2, brand=$3, price=$4, material=$5,
                              releaseDate=$6 where id=$1`,
    getMaterialList: `select name as text, value from material order by value`
  }