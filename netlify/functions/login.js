/**
 * Netlify Function: Login
 * 
 * Validates user credentials and returns a JWT token
 * Environment Variables Required:
 * - AUTH_USERNAME
 * - AUTH_PASSWORD
 * - JWT_SECRET
 */

const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    
    // Get credentials from environment variables
    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    // Validate environment variables are set
    if (!validUsername || !validPassword || !jwtSecret) {
      console.error('Missing required environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Server configuration error'
        })
      };
    }

    // Validate credentials
    if (username === validUsername && password === validPassword) {
      // Create a JWT token (expires in 24 hours)
      const token = jwt.sign(
        { username: username },
        jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: token,
          username: username
        })
      };
    }

    // Invalid credentials
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
