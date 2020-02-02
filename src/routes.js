import { Router } from 'express';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/sessions', SessionController.store);

/**
 * Temos 2 tipos de middlewares
 * [1] Local: Definido na instanciação da rota
 * [2] Global: Definido diretamente no .use() do express
 * Ao ser definido da forma como está abaixo, como o código é lido linha após linha,
 * somente as rotas abaixo será obrigatória a autenticação
 */
routes.use(authMiddleware);

routes.get('/recipients', RecipientController.index);
routes.get('/recipients/:id', RecipientController.show);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete);

export default routes;
