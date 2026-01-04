/**
 * Vercel API Route Template for @af/sweph
 *
 * Save this as: pages/api/planets.ts or app/api/planets/route.ts
 */

import { withSwephInstance, createServerlessSweph, AYANAMSA } from '@af/sweph';

let swephInstance: any = null;

export default async function handler(req, res) {
  try {
    // Option 1: Automatic connection pooling (recommended)
    // const planets = await withSwephInstance(async (sweph) => {
    //   return await sweph.calculatePlanets(new Date());
    // });

    // Option 2: Manual instance management
    if (!swephInstance) {
      swephInstance = await createServerlessSweph({
        preWarm: true
      });
    }

    const { date, ayanamsa = AYANAMSA.LAHIRI, timezone = 0 } = req.query;
    const calculationDate = date ? new Date(date) : new Date();

    // Use either approach:
    const planets = await swephInstance.calculatePlanets(calculationDate, {
      ayanamsa: parseInt(ayanamsa),
      timezone: parseFloat(timezone)
    });

    // Alternative with connection pooling:
    // const planets = await withSwephInstance(async (sweph) => {
    //   return await sweph.calculatePlanets(calculationDate, {
    //     ayanamsa: parseInt(ayanamsa),
    //     timezone: parseFloat(timezone)
    //   });
    // });

    res.status(200).json({
      success: true,
      data: planets,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sweph calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// For Next.js 13+ app directory
export async function GET(request) {
  try {
    if (!swephInstance) {
      swephInstance = await createSweph({
        serverlessMode: true,
        enableCaching: true
      });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const ayanamsa = searchParams.get('ayanamsa') || AYANAMSA.LAHIRI;
    const timezone = searchParams.get('timezone') || 0;

    const calculationDate = date ? new Date(date) : new Date();

    const planets = await swephInstance.calculatePlanets(calculationDate, {
      ayanamsa: parseInt(ayanamsa),
      timezone: parseFloat(timezone)
    });

    return Response.json({
      success: true,
      data: planets,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
