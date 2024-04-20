import { ObjectId } from 'mongodb';
import { promisify } from 'util';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import db from '../utils/db';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const { FOLDER_PATH = '/tmp/files_manager' } = process.env;

mkdirAsync(FOLDER_PATH, { recursive: true });

class FilesController {
  static async postUpload(request, response) {
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = request.body;
    let parentFolder = null;

    if (!FilesController.postUploadValidateBody(request.body, response)) {
      return;
    }

    if (parentId) {
      parentFolder = await db.getFile({ _id: ObjectId(parentId) });

      if (!parentFolder) {
        response.status(400).json({
          error: 'Parent not found',
        });
        return;
      }

      if (parentFolder.type !== 'folder') {
        response.status(400).json({
          error: 'Parent is not a folder',
        });
        return;
      }
    }

    const filePath = `${FOLDER_PATH}/${uuidv4()}`;

    const newFileData = {
      userId: request.user._id.toString(),
      name,
      type,
      isPublic,
      parentId,
    };

    if (type !== 'folder') {
      const decodedData = Buffer.from(data, 'base64');

      newFileData.localPath = filePath;
      await writeFileAsync(filePath, decodedData);
    }

    await db.createFile(newFileData);

    response.status(201).json({
      id: newFileData._id.toString(),
      userId: request.user._id.toString(),
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static postUploadValidateBody(body, response) {
    const { name, type, data } = body;

    if (!name) {
      response.status(400).json({
        error: 'Missing name',
      });
      return false;
    }

    if (!type) {
      response.status(400).json({
        error: 'Missing type',
      });
      return false;
    }

    if (type !== 'folder' && !data) {
      response.status(400).json({
        error: 'Missing data',
      });
      return false;
    }

    return true;
  }
}

export default FilesController;
