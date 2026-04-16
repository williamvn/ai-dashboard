import { Global, Module } from '@nestjs/common';
import { StoreService } from './store.service';

/**
 * @Global() makes StoreService available for injection everywhere without
 * each feature module needing to explicitly import StoreModule.
 */
@Global()
@Module({
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
