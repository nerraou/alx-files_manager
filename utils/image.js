import fs from 'fs';
import { promisify } from 'util';
import imageThumbnail from 'image-thumbnail';

const writeFileAsync = promisify(fs.writeFile);

export default async function generateThumbnail(path, width) {
  const thumbnail = await imageThumbnail(path, { width, height: width });

  const thumbnailPath = `${path}_${width}`;

  await writeFileAsync(thumbnailPath, thumbnail);
}
