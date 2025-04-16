import { Module } from '@nestjs/common';
import { TransactionModule } from './transaction/transaction.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


@Module({
  imports: [TransactionModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'FE/dist'), // e.g., 'client/dist'
      exclude: ['/api*'], // exclude API routes from being handled by static server
    }),
  ],
})
export class AppModule {}
