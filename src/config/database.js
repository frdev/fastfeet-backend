require('dotenv/config');

module.exports = {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  define: {
    timestamps: true,
    underscored: true, // Utilizado para padrões de banco de dados - Ex: UserGroup -> user_groups
    underscoredAll: true // Utiliza o padrão de nomenclatura nome_variavel
  }
};
