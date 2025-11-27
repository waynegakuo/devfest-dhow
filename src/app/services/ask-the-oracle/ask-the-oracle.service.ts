import {inject, Injectable} from '@angular/core';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { from } from 'rxjs';
import {FirebaseApp} from '@angular/fire/app';

@Injectable({
  providedIn: 'root'
})
export class AskTheOracleService {
  private firebaseApp = inject(FirebaseApp);
  private functions;

  constructor() {
  this.functions = getFunctions(this.firebaseApp, 'africa-south1');

  }

  askQuestion(question: string) {
    const askTheOracle = httpsCallable(this.functions, 'askTheOracle');
    return from(askTheOracle({ question }));
  }
}
