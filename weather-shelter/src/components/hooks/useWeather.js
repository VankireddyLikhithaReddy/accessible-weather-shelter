import { useQuery } from "@tanstack/react-query";

export function useCurrentWeather(location) {
  return useQuery({
    queryKey: ['/api/weather/current', location],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/weather/current/${encodeURIComponent(location)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch current weather');
      }
      return response.json();
    },
    enabled: !!location,
  });
}

export function useWeatherForecast(location, days = 3) {
  return useQuery({
    queryKey: ['/api/weather/forecast', location, days],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/weather/forecast/${encodeURIComponent(location)}?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }
      return response.json();
    },
    enabled: !!location,
  });
}

export function useWeatherAlerts(location) {
  return useQuery({
    queryKey: ['/api/weather/alerts', location],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/weather/alerts/${encodeURIComponent(location)}`);
      console.log(response)
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    
    },
    enabled: !!location,
    refetchInterval: 60000, // refetch every 1 minute
  });
}
