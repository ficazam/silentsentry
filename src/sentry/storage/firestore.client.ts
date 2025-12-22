import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreClient {
  private app: admin.app.App;

  constructor(private readonly config: ConfigService) {
    const json = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');

    if (!json) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required');
    }
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required');
    }

    const parsed = JSON.parse(json);

    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId,
      });
    } else {
      this.app = admin.app();
    }
  }

  db(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  FieldValue() {
    return admin.firestore.FieldValue;
  }
}
