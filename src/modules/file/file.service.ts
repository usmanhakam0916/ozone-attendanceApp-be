import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { Repository } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { User } from '../user/user.entity';

import { File } from './file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) { }

  async uploadFile(file, user, employeeId) {
    try {
      const employee = await this.employeeRepo.findOne({
        where: employeeId ? { id: employeeId } : { authUser: user },
      });

      if (!employee) {
        throw new HttpException(
          `Employee does not exist against this id :${employeeId}`,
          HttpStatus.NOT_FOUND,
        );
      }
      // if (employee.avatar) {
      //   const url = path.join(
      //     __dirname,
      //     '../../../',
      //     `/${employee.avatar.url}`,
      //   );
      //   await fs.unlinkSync(url);
      // }
      // const file_path = path.join(
      //   __dirname,
      //   `../../../public/uploads`,
      //   `${new Date().getTime()}.${file.originalname.split('.')[1]}`,
      // );
      //    const r = fs.writeFileSync(file_path, file.buffer, 'base64');
      const uploadResult = await this.uploadFileToS3(file, 'userProfiles');
      // console.log(file_path,"test")
      const avatar = new File();
      avatar.name = file.originalname;
      avatar.url = '';
      // file_path.split('stag_api/')[1];
      avatar.key = uploadResult['Key'];
      const res = await this.fileRepo.save(avatar);
      employee.avatar = res;
      this.employeeRepo.save(employee);
      return res;
    } catch (error) {
      console.log(error, 'exception');
      return error;
    }
  }

  async deletePublicFile(id: number) {
    const file: File = await this.fileRepo.findOne(id);
    // check if file existing
    // because some of the files are being delete from client side
    if (file && file.id && file.key) {
      const s3 = new S3();
      await s3
        .deleteObject({
          Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
          Key: file.key,
        })
        .promise();
      return this.fileRepo.delete(file.id);
    }
  }

  async findById(id: number): Promise<File> {
    return this.fileRepo.findOne(id);
  }

  async uploadFileToS3(file, folderName) {
    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REIGION,
    });
    const uploadResult = await s3
      .upload({
        Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
        Body: file?.buffer || file,
        Key: `${folderName}/${new Date().getTime()}-${file.originalname}`,
        ACL: 'public-read',
      })
      .promise();
    return uploadResult;
  }

  async updateKey(key, id) {
    const file = await this.fileRepo.findOne(id);
    file.key = key;
    this.fileRepo.save(file);
  }
}
