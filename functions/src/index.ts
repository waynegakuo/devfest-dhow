/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {getFirestore} from '@angular/fire/firestore';
import {getStorage} from '@angular/fire/storage';
import { genkit } from 'genkit'; // This is the core Genkit library itself
import {initializeApp} from 'firebase-admin';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';
import googleAI from '@genkit-ai/googleai';
import {defineSecret} from 'firebase-functions/params';

// Define your secret keys and other environment variables here
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const storage = getStorage();

enableFirebaseTelemetry();

// Configure Genkit
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: googleAI.model('gemini-2.5-flash')
});



