import { Op } from 'sequelize';
import { startOfDay, endOfDay, format } from 'date-fns';
import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File from '../models/File';

class OrderController {
  async index(req, res) {
    const { deliveryman_id } = req.params;

    const { page = 1, limit = 20, only } = req.query;

    const where = {
      deliveryman_id,
      canceled_at: { [Op.is]: null },
      end_date: { [Op.is]: null }
    };

    if (only === 'delivered') where.end_date = { [Op.not]: null };

    const deliveries = await Delivery.findAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'ASC']],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'city',
            'state',
            'zipcode'
          ]
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url']
        }
      ]
    });

    return res.json(deliveries);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.number(),
      end_date: Yup.number()
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails.' });

    const { deliveryman_id, id } = req.params;

    /** Valida se existe a entrega vinculada ao entregador */
    const delivery = await Delivery.findOne({
      where: { id, deliveryman_id }
    });

    if (!delivery) return res.status(400).json({ error: 'Order not found.' });

    if (delivery.canceled_at)
      return res
        .status(400)
        .json({ error: 'This delivery is already canceled.' });

    const { start_date, end_date } = req.body;

    /** Valida se foi passada o parametro de iniciar a entrega */
    if (start_date) {
      const startDate = Number(start_date);

      /** Valida se a entrega ja nao foi iniciada */
      if (delivery.start_date)
        return res
          .status(400)
          .json({ error: 'This delivery is already started.' });

      /** Valida se esta entre o horario permitido de retirada de pedidos */
      const [hourInit, hourFinish] = ['08:00', '18:00'];

      const dateInHour = format(Number(startDate), 'HH:mm');

      if (dateInHour < hourInit || dateInHour > hourFinish)
        return res
          .status(400)
          .json({ error: 'Deadline for order pickup is 8am to 6pm.' });

      /** Valida se ja registrou 5 entregas para este dia */
      const startedDeliveries = await Delivery.count({
        where: {
          deliveryman_id,
          start_date: {
            [Op.between]: [startOfDay(startDate), endOfDay(startDate)]
          }
        }
      });

      if (startedDeliveries >= 5)
        res.status(401).json({
          error: "It's only possible to withdraw 5 orders on the same day."
        });

      /** Caso passe em todas as validacoes, realiza a retirada do produto */
      delivery.start_date = new Date(startDate).toISOString();
      await delivery.save();
    } else if (end_date) {
      const endDate = Number(end_date);

      /** Valida se a entrega ja nao foi finalizada */
      if (delivery.end_date)
        return res
          .status(400)
          .json({ error: 'This delivery is already finalized.' });

      /** Valida se foi enviado o arquivo de assinatura da entrega */
      if (!req.file)
        return res.status(400).json({ error: 'Signature file is required.' });

      /** Salva na tabela de arquivos */
      const { originalname: name, filename: path } = req.file;
      const signature = await File.create({
        name,
        path
      });

      /** Atualiza o pedido */
      delivery.end_date = new Date(endDate).toISOString();
      delivery.signature_id = signature.id;
      await delivery.save();
    } else {
      /** Caso nao seja enviado nenhum dos dois */
      return res.status(400).json({
        error: "It's only possible update start_date or end_date."
      });
    }

    return res.json(delivery);
  }
}

export default new OrderController();
