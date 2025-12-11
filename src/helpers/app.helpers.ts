import moment = require('moment');
const ZERO_DATE = '0001-01-01T09:00:00.000Z';
import path from 'path';
import Jimp from 'jimp';
import * as bcrypt from 'bcrypt';

class AppHelpers {
  static getDateTimeSorter = (property: any) => (a: any, b: any) => {
    const first = a[property] || ZERO_DATE;
    const second = b[property] || ZERO_DATE;
    return moment(first).diff(moment(second));
  };

  static getCurrentDateTime = () => {
    const d = new Date();
    const local = d.getTime();
    const offset = d.getTimezoneOffset() * (60 * 1000);
    const utc = new Date(local + offset);
    const riyadh = new Date(utc.getTime() + 3 * 60 * 60 * 1000);
    return moment(riyadh.toLocaleString()).format('YYYY-MM-DD HH:mm:ss');
  };

  static async convertJpegToPng(image_path) {
    let img_path = path.join(__dirname, `../../${image_path}`);
    const response_path = path.join(
      __dirname,
      `../../public/uploads/${new Date().getTime()}_response.png`,
    );
    const image = await Jimp.read(img_path);
    image.write(response_path);
    return response_path;
  }

  static removeExtraSpaces(string) {
    return string ? string?.replace(/\s+/g, ' ')?.toLowerCase()?.trim() : '';
  }

  static async hashPassword(rawPassword: string) {
    const SALT = await Promise.resolve(bcrypt.genSaltSync());
    return bcrypt.hashSync(rawPassword, SALT);
  }

  static async comparePassword(rawPassword: string, hash: string) {
    return bcrypt.compareSync(rawPassword, hash);
  }
}

export { AppHelpers };
