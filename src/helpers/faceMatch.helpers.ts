import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CompareFacesCommand,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';
const AWS_BUCKET = process.env.AWS_PUBLIC_BUCKET_NAME;

@Injectable()
class FaceMatchHelpers {
  static async compareFaces(source_image, destination_image) {
    try {
      // NOTE: v2 constructed an AWS.Config here and discarded it (a no-op);
      // credentials resolve from the default environment chain in both SDKs.
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
      const client = new RekognitionClient({
        region: process.env.AWS_REIGION,
      });
      const does_face_match = await compareFacesPromise(client, compareObject);
      return does_face_match;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}

const compareFacesPromise = (client, params) => {
  return new Promise((resolve, reject) => {
    client
      .send(new CompareFacesCommand(params))
      .then((response) => {
        if (!response.FaceMatches || response.FaceMatches.length == 0) {
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
      })
      .catch(() => {
        reject({ message: 'Face does not match' });
      });
  });
};

export { FaceMatchHelpers };
