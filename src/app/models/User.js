import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    /**
     * Inicializa a relação da tabela com a model de usuário
     */
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL, // CAMPO QUE NÃO EXISTE NA BASE DE DADOS, EXISTE SOMENTE DA MODEL
        password_hash: Sequelize.STRING,
        administrator: Sequelize.BOOLEAN
      },
      {
        sequelize
      }
    );
    // Hook: Trecho de códigos executados automaticamente baseados em ações que acontecem no nosso model
    // beforeSave: antes do usuário ser salvo no banco de dados, executa uma função
    this.addHook('beforeSave', async user => {
      if (user.password)
        user.password_hash = await bcrypt.hash(user.password, 8);
    });
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
