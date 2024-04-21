import { ObjectId } from 'mongodb';
import { promisify } from 'util';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

import db from '../utils/db';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);

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

  static async getShow(request, response) {
    try {
      const { id } = request.params;

      const file = await db.getFile({
        _id: ObjectId(id),
        userId: request.user._id.toString(),
      });

      if (!file) {
        response.status(404).json({
          error: 'Not found',
        });
        return;
      }

      response.json({
        id: file._id.toString(),
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      response.status(500).json({
        error: 'server error',
      });
    }
  }

  static async getIndex(request, response) {
    try {
      const { parentId = 0, page = 0 } = request.query;

      let transformedParentId = parentId;

      if (transformedParentId === '0') {
        transformedParentId = 0;
      }

      const files = await db.getFiles(
        { parentId: transformedParentId },
        page,
        20,
      );

      response.json(
        files.map((file) => ({
          id: file._id.toString(),
          userId: file.userId,
          name: file.name,
          type: file.type,
          isPublic: file.isPublic,
          parentId: file.parentId,
        })),
      );
    } catch (error) {
      response.status(500).json({
        error: 'server error',
      });
    }
  }

  static async putPublish(request, response) {
    try {
      const { id } = request.params;

      const file = await db.getFile({
        _id: ObjectId(id),
        userId: request.user._id.toString(),
      });

      if (!file) {
        response.status(404).json({
          error: 'Not found',
        });
        return;
      }

      await db.updateFile(
        {
          _id: ObjectId(id),
        },
        {
          isPublic: true,
        },
      );

      response.json({
        id: file._id.toString(),
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId,
      });
    } catch (error) {
      response.status(500).json({
        error: 'server error',
      });
    }
  }

  static async putUnpublish(request, response) {
    try {
      const { id } = request.params;

      const file = await db.getFile({
        _id: ObjectId(id),
        userId: request.user._id.toString(),
      });

      if (!file) {
        response.status(404).json({
          error: 'Not found',
        });
        return;
      }

      await db.updateFile(
        {
          _id: ObjectId(id),
        },
        {
          isPublic: false,
        },
      );

      response.json({
        id: file._id.toString(),
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId,
      });
    } catch (error) {
      response.status(500).json({
        error: 'server error',
      });
    }
  }

  static async getFile(request, response) {
    try {
      const { id } = request.params;

      const file = await db.getFile({
        _id: ObjectId(id),
        userId: request.user._id.toString(),
      });

      if (!file || !file.isPublic) {
        response.status(404).json({
          error: 'Not found',
        });
        return;
      }

      if (file.type === 'folder') {
        response.status(400).json({
          error: "A folder doesn't have content",
        });
        return;
      }

      if (!fs.existsSync(file.localPath)) {
        response.status(404).json({
          error: 'Not found',
        });
        return;
      }

      const fileContent = await readFileAsync(file.localPath);

      response.setHeader('Content-Type', mime.contentType(file.name));
      response.send(fileContent);
    } catch (error) {
      response.status(500).json({
        error: 'server error',
      });
    }
  }
}

export default FilesController;
