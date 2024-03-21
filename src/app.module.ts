import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyWebSocketClient } from './my-web-socket-client.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BlockController } from './BlockController';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forRoot('mongodb://localhost/test-db'),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client', 'browser'),
    }),
  ],
  controllers: [AppController, BlockController],
  providers: [AppService, MyWebSocketClient],
})
export class AppModule {}
