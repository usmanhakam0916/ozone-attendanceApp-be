import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
const AWS_BUCKET = process.env.AWS_PUBLIC_BUCKET_NAME;

@Injectable()
class FaceMatchHelpers {
  static async compareFaces(source_image, destination_image) {
    try {
      new AWS.Config({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      AWS.config.update({ region: process.env.AWS_REIGION });
      const compareObject = {
        SourceImage: {
          S3Object: {
            Bucket: AWS_BUCKET,
            Name: source_image,
          },
        },
        TargetImage: {
          S3Object: {
            Bucket: AWS_BUCKET,
            Name: destination_image,
          },
        },
        SimilarityThreshold: 70,
      };
      const client = new AWS.Rekognition();
      const does_face_match = await compareFacesPromise(client, compareObject);
      return does_face_match;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}

const compareFacesPromise = (client, params) => {
  return new Promise((resolve, reject) => {
    client.compareFaces(params, function (err, response) {
      if (err) {
        reject({ message: 'Face does not match' });
      } else {
        if (response.FaceMatches.length == 0) {
          reject({ message: 'Face does not match' });
        } else {
          response.FaceMatches.forEach((data) => {
            let position = data.Face.BoundingBox;
            let similarity = data.Similarity;
            console.log(
              `The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`,
            );
            if (similarity > 90) {
              resolve({ message: 'succcess' });
            } else {
              reject({ message: 'Face does not match' });
            }
          });
        }
      }
    });
  });
};

export { FaceMatchHelpers };
