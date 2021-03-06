import auth0 from 'auth0-js';
import config from '../config';

export default class Auth {
  auth0 = new auth0.WebAuth({
    domain: config.auth0Domain,
    clientID: config.auth0ClientID,
    redirectUri: config.auth0RedirectUri,
    audience: config.auth0Audience,
    responseType: config.auth0ResponseType,
    scope: config.auth0Scope
  });

  constructor() {
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);

    this.accessToken = undefined;
    this.userProfile = undefined;

    this.authorizedCallback = () => {};
    this.deauthorizedCallback = () => {};
  }

  login() {
    this.auth0.authorize();
  }

  handleAuthentication() {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.getUserInfo(authResult);
      } else if (err) {
        console.error(err);
      }
    });
  }

  getUserInfo(authResult) {
    // Use access token to retrieve user's profile and set session
    this.auth0.client.userInfo(authResult.accessToken, (err, profile) => {
      if (!err) {
        this.setSession(authResult, profile);
      } else {
        console.error(err);
      }
    });
  }

  setSession(authResult, userProfile) {
    // Set the time that the Access Token will expire at
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('expires_at', expiresAt);

    this.accessToken = authResult.accessToken;
    this.userProfile = userProfile;

    this.authorizedCallback(this.isAuthenticated());
  }

  logout() {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem('expires_at');

    this.accessToken = undefined;
    this.userProfile = undefined;

    this.deauthorizedCallback(this.isAuthenticated());
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // Access Token's expiry time
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return (Date.now() < expiresAt) && this.accessToken !== undefined;
  }
}
