/**
 * Netlify Function: Validate Session
 * 
 * Validates a JWT token and returns session status
 * Environment Variables Required:
 * - JWT_SECRET
 */

const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const token = event.queryStringParameters?.token;
    const jwtSecret = process.env.JWT_SECRET;

    // Validate environment variable is set
    if (!jwtSecret) {
      console.error('Missing JWT_SECRET environment variable');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          valid: false,
          error: 'Server configuration error'
        })
      };
    }

    // Check if token is provided
    if (!token) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false })
      };
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          username: decoded.username
        })
      };
    } catch (jwtError) {
      // Token is invalid or expired
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false })
      };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        valid: false,
        error: 'Internal server error'
      })
    };
  }
};
