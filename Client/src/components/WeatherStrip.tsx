import { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
} from "lucide-react";

const WeatherStrip = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // OpenWeatherMap
  const API_KEY = "5ccbeafc701f27440e2e93a3c8e03137"; // your key
  const CITY = "Gandhinagar";

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`
        );

        // If HTTP status is not OK, throw with server message if possible
        if (!res.ok) {
          const maybeJson = await res.json().catch(() => null);
          const msg =
            (maybeJson && (maybeJson.message || maybeJson.error)) ||
            `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const data = await res.json();

        if (!cancelled) setWeather(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load weather");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  const getWeatherIcon = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case "clear":
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case "rain":
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      case "snow":
        return <CloudSnow className="h-5 w-5 text-blue-200" />;
      case "clouds":
      default:
        return <Cloud className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-sm text-muted-foreground">
              Loading weather...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !weather) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Weather unavailable{err ? `: ${err}` : ""}.
          </div>
        </div>
      </div>
    );
  }

  const wMain = weather.weather?.[0]?.main as string | undefined;
  const wDesc = weather.weather?.[0]?.description as string | undefined;

  return (
    <div className="bg-gradient-to-r from-primary/15 to-primary-dark/15 border-b border-primary/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Location and Main Weather */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getWeatherIcon(wMain)}
              <span className="font-medium text-foreground">
                {weather.name || "On Campus"}:
              </span>
              <span className="text-primary-dark font-semibold">
                {Math.round(weather.main?.temp)}°C
              </span>
              <span className="text-muted-foreground capitalize">
                {wDesc ? ` | ${wDesc}` : ""}
              </span>
            </div>
          </div>

          {/* Additional Weather Details */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">Feels like</span>
              <span className="text-foreground font-medium">
                {Math.round(weather.main?.feels_like)}°C
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Humidity</span>
              <span className="text-foreground font-medium">
                {weather.main?.humidity ?? "—"}%
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4 text-gray-500" />
              <span className="text-muted-foreground">Wind</span>
              <span className="text-foreground font-medium">
                {weather.wind?.speed ?? "—"} m/s
              </span>
            </div>
          </div>

          {/* Social Media Icons (optional) */}
        </div>
      </div>
    </div>
  );
};

export default WeatherStrip;
