import Sequelize, { Model } from 'sequelize';

class Delivery extends Model {
  static init(sequelize) {
    super.init(
      {
        product: Sequelize.STRING,
        canceled_at: Sequelize.DATE,
        start_date: Sequelize.DATE,
        end_date: Sequelize.DATE,
        startable: {
          type: Sequelize.VIRTUAL,
          get() {
            return !this.start_date;
          }
        },
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            return !this.canceled_at;
          }
        }
      },
      { sequelize }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Recipient, {
      foreignKey: 'recipient_id',
      as: 'recipient'
    });

    this.belongsTo(models.Deliveryman, {
      foreignKey: 'deliveryman_id',
      as: 'deliveryman'
    });

    this.belongsTo(models.File, {
      foreignKey: 'signature_id',
      as: 'signature'
    });
  }
}

export default Delivery;
