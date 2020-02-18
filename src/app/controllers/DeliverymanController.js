import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    try {
      const deliverymen = await Deliveryman.findAll({
        attributes: ['id', 'name', 'email', 'avatar_id'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'name', 'path', 'url']
          }
        ]
      });
      return res.json(deliverymen);
    } catch (e) {
      console.log(e);
      return res.status(500).json(e);
    }
  }

  async show(req, res) {
    const { id } = req.params;

    try {
      const deliveryman = await Deliveryman.findByPk(id, {
        attributes: ['id', 'name', 'email', 'avatar_id'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url']
          }
        ]
      });

      if (!deliveryman)
        return res.status(400).json({ error: 'Deliveryman not found.' });

      return res.json(deliveryman);
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email()
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails' });

    try {
      const deliverymanExist = await Deliveryman.findOne({
        where: { email: req.body.email }
      });

      if (deliverymanExist)
        return res.status(400).json({ error: 'Deliveryman already exists.' });

      const { id, name, email } = await Deliveryman.create(req.body);

      return res.json({ id, name, email });
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number()
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails' });

    try {
      const { email } = req.body;

      const deliveryman = await Deliveryman.findByPk(req.params.id);

      if (email && email !== deliveryman.email) {
        const deliverymanExist = await Deliveryman.findOne({
          where: { email }
        });

        if (deliverymanExist)
          return res.status(400).json({ error: 'Deliveryman already exists.' });
      }

      const { id, name } = await deliveryman.update(req.body);

      return res.json({ id, name, email });
    } catch (e) {
      return res.json(e);
    }
  }

  async destroy(req, res) {
    const { id } = req.params;

    try {
      await Deliveryman.destroy({ where: { id } });

      return res.json({ error: 'Deliveryman was deleted' });
    } catch (e) {
      return res.status(500).json(e);
    }
  }
}

export default new DeliverymanController();
