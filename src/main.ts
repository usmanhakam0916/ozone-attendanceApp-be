import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { urlencoded, json } from 'express';
import { BugsnagService } from '@nkaurelien/nest-bugsnag';
// import {
//   utilities as nestWinstonModuleUtilities,
//   WinstonModule,
// } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// const WinstonCloudWatch = require('winston-cloudwatch');
dotenv.config();
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // const nestLikeFormat = winston.format.printf(
  //   ({ context, level, timestamp, message }) => {
  //     return `${level}: ${new Date(
  //       timestamp,
  //     ).toLocaleString()}\t [${context}] ${message}`;
  //   },
  // );

  const publicFolderPath = path.join(__dirname, '..', '..', 'public');

  // Create the public folder if it doesn't exist
  if (!fs.existsSync(publicFolderPath)) {
    fs.mkdirSync(publicFolderPath);
  }

  // Specify the path to the index.html file
  const indexPath = path.join(publicFolderPath, 'index.html');

  // Check if the index.html file exists, and create it if it doesn't
  if (!fs.existsSync(indexPath)) {
    // Content to be written to index.html
    const indexContent =
      '<!DOCTYPE html><html><head><title>My NestJS App</title></head><body><h1>Hello, NestJS!</h1></body></html>';
    // Write content to index.html
    fs.writeFileSync(indexPath, indexContent);
  }

  const app = await NestFactory.create(
    AppModule,
    // {
    //   logger: WinstonModule.createLogger({
    //     format: winston.format.uncolorize(), //Uncolorize logs as weird character encoding appears when logs are colorized in cloudwatch.
    //     transports: [
    //       new winston.transports.Console({
    //         format: winston.format.combine(
    //           winston.format.timestamp(),
    //           winston.format.ms(),
    //           nestLikeFormat,
    //         ),
    //       }),
    //       new WinstonCloudWatch({
    //         name: 'Cloudwatch Logs',
    //         logGroupName: process.env.CLOUDWATCH_GROUP_NAME,
    //         logStreamName: process.env.CLOUDWATCH_STREAM_NAME,
    //         awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //         awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    //         awsRegion: process.env.AWS_REGION,
    //       }),
    //     ],
    //   }),
    // }
  );
  const config = new DocumentBuilder()
    .setTitle('Ozone Attendance APIs')
    .setDescription('Complete docs of Backend system of Ozone platform.')
    .setVersion('1.0')
    .addBearerAuth({ in: 'header', type: 'http' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors();
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));
  await app.listen(process.env.PORT);
  console.log(`Server is Running ${await app.getUrl()}`);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.get(BugsnagService).handleAnyErrors(app);
}
bootstrap();

// import { createLogger, format } from 'winston';
// import * as WinstonCloudWatch from 'winston-cloudwatch';

// export const log = createLogger({
//     level: 'debug',
//     format: format.json(),
//     transports: [
//         new WinstonCloudWatch({
//             level: 'error',
//             logGroupName: 'groupName',
//             logStreamName: 'errors',
//             awsRegion: 'eu-west-3'
//         }),
//     ]
