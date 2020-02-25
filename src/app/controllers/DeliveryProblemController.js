import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class ProblemController {
  async index(req, res) {
    const { delivery_id } = req.params;

    const problems = await DeliveryProblem.findAll({
      where: { delivery_id },
      order: [['created_at', 'ASC']]
    });

    return res.json(problems);
  }

  async store(req, res) {
    const { delivery_id } = req.params;
    const { description } = req.body;

    const delivery = await Delivery.findByPk(delivery_id);

    if (!delivery) res.status(400).json({ error: 'Delivery not found.' });

    if (delivery.canceled_at)
      return res
        .status(400)
        .json({ error: 'This delivery is already canceled.' });

    if (delivery.end_date)
      return res
        .status(400)
        .json({ error: 'This delivery is already finalized.' });

    if (!delivery.start_date)
      return res.status(400).json({ error: 'This delivery has not started.' });

    const problem = await DeliveryProblem.create({
      delivery_id,
      description
    });

    return res.json(problem);
  }

  async destroy(req, res) {
    const { id } = req.params;

    const problem = await DeliveryProblem.findByPk(id, {
      include: [
        {
          model: Delivery,
          as: 'delivery'
        }
      ]
    });

    if (!problem.delivery.cancelable)
      return res
        .status(400)
        .json({ error: 'This delivery cannot be canceled.' });

    const delivery = await Delivery.findByPk(problem.delivery_id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'zipcode',
            'street',
            'number',
            'complement',
            'state',
            'city'
          ]
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    delivery.canceled_at = new Date().toISOString();

    await delivery.save();

    await Queue.add(CancellationMail.key, { delivery });

    return res.json(delivery);
  }
}

export default new ProblemController();
