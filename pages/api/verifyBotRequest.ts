import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { NextApiRequest } from "next";

/**
 * Microsoft Bot Framework OpenID Metadata URL
 */
const MICROSOFT_OPENID_CONFIG =
  "https://login.botframework.com/v1/.well-known/openidconfiguration";

/**
 * Get Microsoft’s JSON Web Key Set (JWKS) client
 */
const client = jwksClient({
  jwksUri: "https://login.botframework.com/v1/.well-known/keys",
});

/**
 * Function to retrieve signing key from JWKS
 */
const getSigningKey = async (kid: string): Promise<string> => {
  const key = await client.getSigningKey(kid);
  return key.getPublicKey();
};

/**
 * Verify Microsoft Bot Framework JWT Token
 * @param req The Next.js API request object
 */
export async function verifyBotRequest(req: NextApiRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("⚠️ Missing or invalid Authorization header");
  }

  try {
    const token = authHeader.split(" ")[1]; // Extract token

    // Decode the JWT header to get the key ID (kid)
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new Error("Invalid JWT: Missing key ID (kid).");
    }

    // Fetch the correct public key from JWKS
    const publicKey = await getSigningKey(decodedHeader.header.kid);

    // ✅ Verify the token using Microsoft's public key
    const decodedToken = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "https://api.botframework.com",
      audience: process.env.APP_ID, // Ensure the token was issued for your bot
    });

    // ✅ Ensure the request is coming from Microsoft Teams
    // Ensure decoded is a JwtPayload (not a string)
    if (typeof decodedToken === "string") {
      throw new Error("🔴 Invalid JWT structure.");
    }

    console.log("✅ JWT verified successfully:", decodedToken);

    console.log(decodedToken);
    // ✅ Ensure the request is coming from Microsoft Teams
    if (!req.body.channelId || req.body.channelId !== "msteams") {
      console.error("🔴 Unauthorized request: Not from Microsoft Teams.");
      throw new Error("🔴 Unauthorized request: Not from Microsoft Teams.");
    }

    console.log("JWT verified successfully:", decodedToken);
    return true;
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("Unauthorized bot request");
  }
}
