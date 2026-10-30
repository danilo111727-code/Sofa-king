// Called only after the bearer JWT has passed local signature, issuer and expiry checks.
// The existing identity endpoint returns booleans and email; it does not expose userId.
export function isAuthorizedAdminResponse(info) {
 return info?.signedIn === true && info?.isAdmin === true;
}
