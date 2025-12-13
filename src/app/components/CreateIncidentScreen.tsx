import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Camera, Clock, Save } from "lucide-react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { ConnectivityBanner } from "./ConnectivityBanner";
import type { IncidentReport } from "../utils/storage";

interface CreateIncidentScreenProps {
  isOnline: boolean;
  onBack: () => void;
  onSave: (report: Omit<IncidentReport, "id" | "createdAt" | "status">) => void;
}

const INCIDENT_TYPES: IncidentReport["type"][] = [
  "Flood",
  "Landslide",
  "Road Block",
  "Power Line Down",
];

const SEVERITY_LEVELS = [
  { value: 1, label: "Minor", color: "bg-blue-500" },
  { value: 2, label: "Low", color: "bg-green-500" },
  { value: 3, label: "Fair", color: "bg-yellow-500" },
  { value: 4, label: "High", color: "bg-orange-500" },
  { value: 5, label: "Critical", color: "bg-red-500" },
] as const;

type LatLng = { latitude: number; longitude: number };

export function CreateIncidentScreen({
  isOnline,
  onBack,
  onSave,
}: CreateIncidentScreenProps) {
  const [incidentType, setIncidentType] = useState<IncidentReport["type"] | "">(
    "",
  );
  const [severity, setSeverity] = useState<number>(3);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [timestamp] = useState<string>(new Date().toISOString());
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const captureLocation = useCallback(() => {
    setLocationLoading(true);

    const fallbackLocation: LatLng = {
      latitude: 37.7749,
      longitude: -122.4194,
    };

    if (!navigator.geolocation) {
      setLocation(fallbackLocation);
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocation(fallbackLocation);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      captureLocation();
    }, 0);

    return () => window.clearTimeout(t);
  }, [captureLocation]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") setPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!incidentType || !location) return;

    onSave({
      type: incidentType,
      severity: severity as IncidentReport["severity"],
      location,
      timestamp,
      photo,
    });
  };

  const mapSrc = useMemo(() => {
    if (!location) return "";

    const lat = location.latitude;
    const lon = location.longitude;

    const d = 0.005;
    const left = lon - d;
    const right = lon + d;
    const top = lat + d;
    const bottom = lat - d;

    const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
    const marker = `${lat}%2C${lon}`;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <ConnectivityBanner isOnline={isOnline} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="m-0">Create Incident Report</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Incident type */}
          <Card className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incident-type">Incident Type</Label>

              <Select
                value={incidentType}
                onValueChange={(value: string) =>
                  setIncidentType(value as IncidentReport["type"])
                }
              >
                <SelectTrigger id="incident-type" className="bg-input-background">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>

                <SelectContent>
                  {INCIDENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Severity */}
          <Card className="p-5 space-y-4">
            <div className="space-y-3">
              <Label>Severity Level</Label>

              <div className="grid grid-cols-5 gap-2">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSeverity(level.value)}
                    className={[
                      "rounded-lg border-2 transition-all",
                      "px-2 py-2",
                      "flex flex-col items-center justify-center",
                      "min-h-[64px]",
                      "leading-tight",
                      severity === level.value
                        ? "border-primary scale-[1.02]"
                        : "border-transparent",
                      level.color,
                      "text-white",
                      "hover:scale-[1.02]",
                    ].join(" ")}
                    aria-pressed={severity === level.value}
                  >
                    <div className="text-lg font-semibold">{level.value}</div>
                    <div className="text-[10px] sm:text-xs text-center break-words whitespace-normal px-1">
                      {level.label}
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground m-0">
                Select the severity that best matches the situation.
              </p>
            </div>
          </Card>

          {/* Location with map */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <Label className="m-0">Location</Label>
            </div>

            {locationLoading ? (
              <p className="text-sm text-muted-foreground m-0">
                Capturing location...
              </p>
            ) : location ? (
              <div>
                {/* Map preview */}
                <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
                  <iframe
                    title="Location map"
                    src={mapSrc}
                    className="w-full h-44"
                    loading="lazy"
                  />
                </div>

                {/* Space below map */}
                <p className="text-xs text-muted-foreground m-0 mt-3">
                  Location captured. Tap “Capture Location” to refresh if needed.
                </p>

                {/* Extra spacing before button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureLocation}
                    className="w-full"
                  >
                    Capture Location
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={captureLocation}
                className="w-full"
              >
                Capture Location
              </Button>
            )}
          </Card>

          {/* Timestamp */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <Label className="m-0">Timestamp</Label>
            </div>

            <Input
              value={new Date(timestamp).toLocaleString()}
              disabled
              className="bg-muted/30"
            />
          </Card>

          {/* Photo */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <Label htmlFor="photo" className="m-0">
                Photo Upload (Optional)
              </Label>
            </div>

            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="bg-input-background cursor-pointer"
            />

            {photo && (
              <div className="mt-3">
                <img
                  src={photo}
                  alt="Incident preview"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
              </div>
            )}
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-auto py-4 gap-3"
            disabled={!incidentType || !location}
          >
            <Save className="w-5 h-5" />
            <span>Save Incident Locally</span>
          </Button>

          <p className="text-sm text-muted-foreground text-center m-0">
            This report will be saved even if you are offline.
          </p>
        </form>
      </div>
    </div>
  );
}
