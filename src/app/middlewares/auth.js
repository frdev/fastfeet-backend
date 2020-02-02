import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: 'Token is required.' });

  /**
   * [authHeader.split]: Será quebrado em dois index do array
   * [0]: Contém a string Bearer que é o tipo de token
   * [1]: Contém o token
   * [, token]: Ignora a primeira posição e recupera somente o token que está em [1]
   */
  const [, token] = authHeader.split(' ');

  try {
    /**
     * ! A função jwt.verify é uma promise, onde o 1º parâmetro é o token e o 2º é o secret
     * [promisify]: Transforma uma promise em uma função async/await
     * @ seu retorno é uma função async/await
     */
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
