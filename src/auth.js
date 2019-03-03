const AWS = require('aws-sdk');
const settings = require('./settings');

// Based on: https://docs.aws.amazon.com/cognito/latest/developerguide/google.html
async function getAwsCredentials(idToken) {
  // Add the Google access token to the Cognito credentials login map.
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: settings.identityPoolId,
    Logins: {
      'accounts.google.com': idToken
    }
  });

  AWS.config.region = 'eu-central-1';


  // Obtain AWS credentials
  return AWS.config.credentials.getPromise()
    .then(x => {
      console.log('AWS credentials successfully obtained. Expire at ' + AWS.config.credentials.expireTime.toISOString());
      return x;
    })
    .catch(err => {
      console.log('get AWS credentials failed', err)
      if (err.code === 'NotAuthorizedException') {
        throw new Error(`Access Denied`);
      }
      throw err;
    });
}


class Pacer {
  constructor(decelerationFactor) {
    if (!Number.isFinite(decelerationFactor) || decelerationFactor < 1) {
      throw new Error(`Illegal argument (acceleration factor=${decelerationFactor})`);
    }
    this.decelerationFactor = decelerationFactor;
    this.deccelerationSteps = 0;
    this.count = 0;
  }

  sparser() {
    this.deccelerationSteps += 1;
    return this.deccelerationSteps;
  }

  reset() {
    this.deccelerationSteps = 0;
  }

  next() {
    this.count += 1;
    const every = Math.pow(this.decelerationFactor, this.deccelerationSteps);
    return (this.count % every === 0);
  }
}

class CredentialsRefresher {
  constructor(googleUser) {
    this.googleUser = googleUser;
    this.expiresAt = -1;
    this.numConsecutiveFailures = 0;
    this.intervalId = null;
    this.changePhase('UNSTARTED');
    this.pacer = new Pacer(4);
  }

  changePhase(arg) {
    if (this.phase !== arg) {
      console.log(`Phase change: "${this.phase}" -> "${arg}"`);
    }
    this.phase = arg;
  }

  async refreshGoogle() {
    if (this.phase === 'REFRESH_IN_PROGRESS') {
      return;
    }

    if (this.phase !== 'RUNNING') {
      throw new Error(`This operation (refresh) is not allowed at this stage (${this.phase})`)
    }


    if (!this.pacer.next()) {
      return;
    }

    const timeLeft = this.expiresAt - Date.now();
    const tokenIsOk = timeLeft >= 5 * 60 * 1000;
    if (tokenIsOk) {
      return;
    }

    console.log(`Refreshing the Google token`);
    try {
      this.changePhase('REFRESH_IN_PROGRESS');
      const resp = await this.googleUser.reloadAuthResponse();
      console.log('new resp received!');
      await this.processAuthResponse(resp);
      this.pacer.reset();
    } catch (e) {
      const sparsity = this.pacer.sparser();
      console.error(`Failed to get credentials (${sparsity} in a row)`, e);
      if (sparsity >= 6) {
        console.log('too many consecutive failures');
        this.stop();
        return;
      }
    }
    this.changePhase('RUNNING');
  }
  
  async processAuthResponse(resp) {
    this.expiresAt = resp.expires_at;

    // The ID token you need to pass to your backend:
    const idToken = resp.id_token;
    return await getAwsCredentials(idToken);  
  }

  start() {
    if (this.phase !== 'UNSTARTED') {
      throw new Error(`This operation (start) is not allowed at this stage (${this.phase})`)
    }
    const resp = this.googleUser.getAuthResponse();
    this.processAuthResponse(resp);
    this.intervalId = setInterval(() => this.refreshGoogle(), 1000);
    this.changePhase('RUNNING');
  }

  stop() {
    this.changePhase('STOPPED');
    clearInterval(this.intervalId);
    this.intervalId = null;  
  }
}

export default async function auth(googleUser) {  
  new CredentialsRefresher(googleUser).start();
}

