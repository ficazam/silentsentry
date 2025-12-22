import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FirestoreClient } from "./firestore.client";
import { FirestoreStorage } from "./firestore.storage";

@Module({
  imports: [ConfigModule],
  providers: [FirestoreClient, FirestoreStorage],
  exports: [FirestoreStorage, FirestoreClient],
})
export class StorageModule {}
