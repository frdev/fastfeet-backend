module.exports = {
  dialect: 'postgres',
  host: '192.168.99.100',
  username: 'postgres',
  password: 'docker',
  database: 'fastfeet',
  define: {
    timestamps: true,
    underscored: true, // Utilizado para padrões de banco de dados - Ex: UserGroup -> user_groups
    underscoredAll: true // Utiliza o padrão de nomenclatura nome_variavel
  }
};
