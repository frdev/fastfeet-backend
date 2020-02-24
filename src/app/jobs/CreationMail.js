import Mail from '../../lib/Mail';

class CreationMail {
  get key() {
    return 'CreationMail';
  }

  async handle({ data }) {
    const { delivery } = data;
    console.log(delivery);

    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}>`,
      subject: 'Nova entrega disponivel',
      template: 'creation',
      context: {
        deliveryman: delivery.deliveryman.name,
        recipient: delivery.recipient.name,
        product: delivery.product,
        street: delivery.recipient.street,
        number: delivery.recipient.number,
        complement: delivery.recipient.complement,
        city: delivery.recipient.city,
        state: delivery.recipient.state,
        zipcode: delivery.recipient.zipcode
      }
    });
  }
}

export default new CreationMail();
