import * as Yup from 'yup';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import File from '../models/File';

import CreationMail from '../jobs/CreationMail';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page = 1, limit = 20, recipient_id, deliveryman_id } = req.query;

    const where = {};

    if (recipient_id) where.recipient_id = recipient_id;
    if (deliveryman_id) where.deliveryman_id = deliveryman_id;

    const deliveries = await Delivery.findAll({
      where,
      order: ['created_at'],
      limit,
      offset: (page - 1) * limit,
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'cancelable',
        'startable'
      ],
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
          attributes: ['id', 'name', 'email'],
          includes: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url']
            }
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

  async show(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'cancelable',
        'startable'
      ],
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
          attributes: ['id', 'name', 'email'],
          includes: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url']
            }
          ]
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url']
        }
      ]
    });

    if (!delivery)
      return res.status(400).json({ error: 'Delivery not found.' });

    return res.json(delivery);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
      signature_id: Yup.number()
    });

    if (!(await schema.isValid(req.body)))
      res.status(400).json({ error: 'Validations fails.' });

    const deliveryCreated = await Delivery.create(req.body);

    const delivery = await Delivery.findByPk(deliveryCreated.id, {
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
          attributes: ['id', 'name', 'email'],
          includes: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url']
            }
          ]
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url']
        }
      ]
    });

    await Queue.add(CreationMail.key, { delivery });

    return res.json(delivery);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      product: Yup.string(),
      signature_id: Yup.number(),
      canceled_at: Yup.date()
    });

    if (!(await schema.isValid(req.body)))
      res.status(400).json({ error: 'Validations fails.' });

    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
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
          attributes: ['id', 'name', 'email'],
          includes: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url']
            }
          ]
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url']
        }
      ]
    });

    if (delivery.canceled_at)
      return res.status(400).json({
        error: 'This delivery has already been canceled.'
      });

    if (req.body.canceled_at && !delivery.cancelable)
      return res
        .status(400)
        .json({ error: 'This delivery is not cancelable.' });

    if (req.body.start_date && !delivery.startable)
      return res.status(400).json({ error: 'This delivery is not startable.' });

    if (req.body.end_date && !delivery.start_date)
      return res.status(400).json({ error: 'This delivery is not finalized.' });

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(req.body)) {
      if (delivery[key]) delivery[key] = value;
    }

    await delivery.save();

    return res.json(delivery);
  }

  async destroy(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery)
      return res.status(400).json({ error: 'Delivery not found.' });

    if (delivery.canceled_at)
      return res.status(400).json({
        error: 'This delivery has already been canceled.'
      });

    if (delivery.start_date)
      return res.status(400).json({
        error:
          'This delivery cannot be canceled because it has already started.'
      });

    if (delivery.end_date)
      return res.status(400).json({
        error:
          'This delivery cannot be canceled because it has already finalized.'
      });

    delivery.canceled_at = new Date();

    await delivery.save();

    await Queue.add(CancellationMail.key, { delivery });

    return res.json(delivery);
  }
}

export default new DeliveryController();
