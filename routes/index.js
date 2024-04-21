import express from 'express';

import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/status', AppController.getStatus);

router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);

router.get('/connect', AuthController.getConnect);

router.get('/disconnect', AuthController.getDisconnect);

router.get('/users/me', UsersController.getMe);

router.post('/files', AuthController.checkAuth, FilesController.postUpload);

router.get('/files/:id', AuthController.checkAuth, FilesController.getShow);

router.get('/files', AuthController.checkAuth, FilesController.getIndex);

router.put(
  '/files/:id/publish',
  AuthController.checkAuth,
  FilesController.putPublish,
);

router.put(
  '/files/:id/unpublish',
  AuthController.checkAuth,
  FilesController.putUnpublish,
);

router.get('/files/:id/data', FilesController.getFile);

export default router;
