/**
 * AWS Lambda Template for @af/sweph
 *
 * Deploy as: lambda/calculate-planets/index.js
 */

const { createSweph, AYANAMSA } = require('@af/sweph');

let swephInstance = null;

exports.handler = async (event) => {
  try {
    // Reuse instance across warm container invocations
    if (!swephInstance) {
      console.log('Initializing Swiss Ephemeris...');
      swephInstance = await createSweph({
        serverlessMode: true,
        enableCaching: true,
        preWarm: true
      });
      console.log('Swiss Ephemeris initialized');
    }

    const {
      date,
      ayanamsa = AYANAMSA.LAHIRI,
      timezone = 0,
      latitude,
      longitude
    } = event;

    const calculationDate = date ? new Date(date) : new Date();

    // Calculate planets
    const planets = await swephInstance.calculatePlanets(calculationDate, {
      ayanamsa: parseInt(ayanamsa),
      timezone: parseFloat(timezone)
    });

    // Calculate lagna if location provided
    let lagna = null;
    if (latitude && longitude) {
      lagna = await swephInstance.calculateLagna(calculationDate, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone: parseFloat(timezone)
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          planets,
          lagna,
          date: calculationDate.toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
