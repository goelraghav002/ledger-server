import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SyncModule } from './sync/sync.module';
import { OrgsModule } from './orgs/orgs.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuardWithReflector } from './auth/jwt-guard-with-reflector';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TransactionsModule,
    SyncModule,
    OrgsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuardWithReflector,
    },
  ],
})
export class AppModule { }