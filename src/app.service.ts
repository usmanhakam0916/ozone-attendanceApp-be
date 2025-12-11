import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
const KEY = 'hello';

@Injectable()
export class AppService {
  constructor() // private readonly cache: Cache, // @Inject(CACHE_MANAGER)
  { }

  // async setHello(name: string): Promise<void> {
  //   await this.cache.set(KEY, name, { ttl: 3600 });
  // }

  // async getName(): Promise<string> {
  //   const name: string = (await this.cache.get(KEY)) || 'Jack';
  //   return name;
  // }
}
