import Queue from 'bull';
import { ObjectId } from 'mongodb';

import db from './utils/db';
import generateThumbnail from './utils/image';

const fileQueue = new Queue('generate thumbnails');

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await db.getFile({ _id: ObjectId(fileId), userId });

  if (!file) {
    throw new Error('File not found');
  }

  await Promise.all([
    generateThumbnail(file.localPath, 500),
    generateThumbnail(file.localPath, 250),
    generateThumbnail(file.localPath, 100),
  ]);

  done();
});
