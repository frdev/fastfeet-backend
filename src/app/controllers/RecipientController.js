import * as Yup from 'yup';
import { Op } from 'sequelize';
import Recipient from '../models/Recipient';

class RecipientController {
  async index(req, res) {
    const recipient = await Recipient.findAll();
    return res.json(recipient);
  }

  async show(req, res) {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient)
      return res.status(400).json({ error: 'Recipient not found.' });

    return res.json(recipient);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.number()
        .positive()
        .required(),
      complement: Yup.string(),
      state: Yup.string()
        .min(2)
        .max(2)
        .required(),
      city: Yup.string().required(),
      zipcode: Yup.string()
        .min(9)
        .max(9)
        .required()
    });

    if (!(await schema.isValid(req.body)))
      return res.json({ error: 'Validation fails.' });

    try {
      const recipient = await Recipient.findOne({
        where: { name: req.body.name, zipcode: req.body.zipcode }
      });

      if (recipient)
        return res.status(400).json({ error: 'Recipient exists.' });

      const {
        id,
        name,
        street,
        number,
        complement,
        state,
        city
      } = await Recipient.create(req.body);

      return res.json({
        id,
        name,
        street,
        number,
        complement,
        state,
        city
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  async update(req, res) {
    const requiredField = (reference, field) =>
      reference ? field.required() : field;

    const schema = Yup.object().shape({
      name: Yup.string(),
      zipcode: Yup.string()
        .min(9)
        .max(9),
      street: Yup.string().when('zipcode', requiredField),
      number: Yup.number()
        .positive()
        .when('zipcode', requiredField),
      complement: Yup.string().when('zipcode', requiredField),
      state: Yup.string()
        .min(2)
        .max(2)
        .when('zipcode', requiredField),
      city: Yup.string().when('zipcode', requiredField)
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails.' });

    try {
      const recipient = await Recipient.findByPk(req.params.id);
      if (!recipient) return res.status(400).json({ error: 'Id not exists.' });

      /**
       * Validação para não deixar atualizar nome e cep já existente
       */
      const recipientExist = await Recipient.findOne({
        where: {
          [Op.not]: { id: req.params.id },
          name: req.body.name || recipient.name,
          zipcode: req.body.zipcode || recipient.zipcode
        }
      });

      if (recipientExist)
        return res.status(400).json({ error: 'Name + Zipcode already exist.' });

      const {
        id,
        name,
        street,
        number,
        complement,
        state,
        city
      } = await recipient.update(req.body, {
        where: { id: req.params.id }
      });

      return res.json({
        id,
        name,
        street,
        number,
        complement,
        state,
        city
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  async destroy(req, res) {
    try {
      await Recipient.destroy({ where: { id: req.params.id } });
      return res.json({ message: 'Recipient was deleted' });
    } catch (err) {
      return res.status(500).json(err);
    }
  }
}

export default new RecipientController();
