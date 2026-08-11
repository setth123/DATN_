import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  // Các field quan trọng
  return {
    email: payload.email,
    emailVerified: payload.email_verified,
    providerId: payload.sub,
    name: payload.name,
    avatar: payload.picture
  };
};
