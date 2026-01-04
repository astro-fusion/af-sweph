/**
 * Netlify Function Template for @af/sweph
 *
 * Save as: netlify/functions/planets.ts
 */

import { createSweph, AYANAMSA } from '@af/sweph';

let swephInstance: any = null;

exports.handler = async (event) => {
  try {
    // Initialize once per container
    if (!swephInstance) {
      console.log('Initializing Swiss Ephemeris for Netlify...');
      swephInstance = await createSweph({
        serverlessMode: true,
        enableCaching: true,
        preWarm: true
      });
      console.log('Swiss Ephemeris ready');
    }

    const { queryStringParameters = {} } = event;
    const {
      date,
      ayanamsa = AYANAMSA.LAHIRI,
      timezone = 0,
      latitude,
      longitude
    } = queryStringParameters;

    const calculationDate = date ? new Date(date) : new Date();

    // Calculate planets
    const planets = await swephInstance.calculatePlanets(calculationDate, {
      ayanamsa: parseInt(ayanamsa),
      timezone: parseFloat(timezone)
    });

    // Calculate sun/moon data if location provided
    let sunTimes = null;
    let moonPhase = null;

    if (latitude && longitude) {
      const location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone: parseFloat(timezone)
      };

      sunTimes = await swephInstance.calculateSunTimes(calculationDate, location);
      moonPhase = await swephInstance.calculateMoonPhase(calculationDate);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
      body: JSON.stringify({
        success: true,
        data: {
          planets,
          sunTimes,
          moonPhase,
          date: calculationDate.toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Netlify function error:', error);
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
