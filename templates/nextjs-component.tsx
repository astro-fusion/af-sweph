/**
 * Next.js Client Component Template for @af/sweph
 *
 * This shows how to use @af/sweph in a React component with proper loading states
 */

'use client';

import { useState, useEffect } from 'react';

interface PlanetData {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  rasi: number;
  rasiName: string;
}

export default function PlanetsDisplay() {
  const [planets, setPlanets] = useState<PlanetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculatePlanets();
  }, []);

  const calculatePlanets = async () => {
    try {
      setLoading(true);

      // Dynamic import to avoid bundling native modules in client
      const { createSweph, AYANAMSA } = await import('@af/sweph');

      const sweph = await createSweph({
        serverlessMode: true,
        enableCaching: true
      });

      const result = await sweph.calculatePlanets(new Date(), {
        ayanamsa: AYANAMSA.LAHIRI,
        timezone: 5.75 // IST
      });

      setPlanets(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Calculating planetary positions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={calculatePlanets}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Current Planetary Positions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planets.map((planet) => (
          <div key={planet.id} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">{planet.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Longitude: {planet.longitude.toFixed(2)}°</p>
              <p>Sign: {planet.rasiName}</p>
              <p>Speed: {planet.speed.toFixed(4)}°/day</p>
              {planet.latitude !== 0 && (
                <p>Latitude: {planet.latitude.toFixed(2)}°</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
