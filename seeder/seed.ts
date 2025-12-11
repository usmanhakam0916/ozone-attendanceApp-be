import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  NestFactory.createApplicationContext(SeederModule)
    .then(async (appContext) => {
      const seeder = appContext.get(SeederService);

      await seeder.console();
      // await seeder.addLocations();
      await seeder.encryptPasswords();
      // appContext.close();
    })
    .catch((error) => {
      throw error;
    });
}
bootstrap();
