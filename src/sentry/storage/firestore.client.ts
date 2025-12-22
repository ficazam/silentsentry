import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'node:fs';

@Injectable()
export class FirestoreClient {
  private app: admin.app.App;

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');

    const jsonInline = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    const jsonPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required');
    }

    const parsed = this.loadServiceAccount({ jsonInline, jsonPath });

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

    this.app.firestore().settings({ ignoreUndefinedProperties: true });
  }

  private loadServiceAccount(opts: {
    jsonInline?: string;
    jsonPath?: string;
  }): any {
    const { jsonInline, jsonPath } = opts;

    if (jsonPath && jsonPath.trim()) {
      const raw = fs.readFileSync(jsonPath.trim(), 'utf8');
      return JSON.parse(raw);
    }

    if (jsonInline && jsonInline.trim()) {
      return JSON.parse(jsonInline);
    }

    throw new Error(
      'Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH (recommended) or FIREBASE_SERVICE_ACCOUNT_JSON.',
    );
  }

  db(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  FieldValue() {
    return admin.firestore.FieldValue;
  }
}
