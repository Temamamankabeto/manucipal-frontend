"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAllCitiesQuery, useAllSubcitiesQuery, useAllWoredasQuery, useAllZonesQuery } from "@/hooks/location/use-offices";

type LocationCascaderValue = {
  city_id?: number | string | null;
  subcity_id?: number | string | null;
  woreda_id?: number | string | null;
  zone_id?: number | string | null;
};

type LocationCascaderProps = {
  value: LocationCascaderValue;
  onChange: (value: LocationCascaderValue) => void;
  requiredLevel?: "city" | "subcity" | "woreda" | "zone";
  disabled?: boolean;
  errors?: Partial<Record<keyof LocationCascaderValue, string>>;
};

function id(value?: number | string | null) {
  return value ? String(value) : "";
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export default function LocationCascader({ value, onChange, requiredLevel = "zone", disabled = false, errors = {} }: LocationCascaderProps) {
  const cities = useAllCitiesQuery({ status: "active", all: true });
  const subcities = useAllSubcitiesQuery({ status: "active", all: true, city_id: value.city_id });
  const woredas = useAllWoredasQuery({ status: "active", all: true, subcity_id: value.subcity_id });
  const zones = useAllZonesQuery({ status: "active", all: true, woreda_id: value.woreda_id });

  const citySelected = Boolean(value.city_id);
  const subcitySelected = Boolean(value.subcity_id);
  const woredaSelected = Boolean(value.woreda_id);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Field label="City" error={errors.city_id}>
        <Select
          value={id(value.city_id)}
          disabled={disabled || cities.isLoading}
          onValueChange={(next) => onChange({ city_id: toNumber(next), subcity_id: null, woreda_id: null, zone_id: null })}
        >
          <SelectTrigger><SelectValue placeholder={cities.isLoading ? "Loading cities..." : "Select city"} /></SelectTrigger>
          <SelectContent>{(cities.data ?? []).map((city) => <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>

      {(requiredLevel === "subcity" || requiredLevel === "woreda" || requiredLevel === "zone") && (
        <Field label="Subcity" error={errors.subcity_id}>
          <Select
            value={id(value.subcity_id)}
            disabled={disabled || !citySelected || subcities.isLoading}
            onValueChange={(next) => onChange({ ...value, subcity_id: toNumber(next), woreda_id: null, zone_id: null })}
          >
            <SelectTrigger><SelectValue placeholder={!citySelected ? "Select city first" : subcities.isLoading ? "Loading subcities..." : "Select subcity"} /></SelectTrigger>
            <SelectContent>{(subcities.data ?? []).map((subcity) => <SelectItem key={subcity.id} value={String(subcity.id)}>{subcity.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}

      {(requiredLevel === "woreda" || requiredLevel === "zone") && (
        <Field label="Woreda" error={errors.woreda_id}>
          <Select
            value={id(value.woreda_id)}
            disabled={disabled || !subcitySelected || woredas.isLoading}
            onValueChange={(next) => onChange({ ...value, woreda_id: toNumber(next), zone_id: null })}
          >
            <SelectTrigger><SelectValue placeholder={!subcitySelected ? "Select subcity first" : woredas.isLoading ? "Loading woredas..." : "Select woreda"} /></SelectTrigger>
            <SelectContent>{(woredas.data ?? []).map((woreda) => <SelectItem key={woreda.id} value={String(woreda.id)}>{woreda.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}

      {requiredLevel === "zone" && (
        <Field label="Zone" error={errors.zone_id}>
          <Select
            value={id(value.zone_id)}
            disabled={disabled || !woredaSelected || zones.isLoading}
            onValueChange={(next) => onChange({ ...value, zone_id: toNumber(next) })}
          >
            <SelectTrigger><SelectValue placeholder={!woredaSelected ? "Select woreda first" : zones.isLoading ? "Loading zones..." : "Select zone"} /></SelectTrigger>
            <SelectContent>{(zones.data ?? []).map((zone) => <SelectItem key={zone.id} value={String(zone.id)}>{zone.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
}
