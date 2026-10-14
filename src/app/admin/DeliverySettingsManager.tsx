"use client";

import { useState } from "react";
import {
  useDeliverySettings,
  type DeliverySettings,
  type ZoneDef,
} from "@/hooks/useDeliverySettings";

const ZONE_KEYS = [
  "metro",
  "peninsular",
  "east",
  "intl_asia",
  "intl_europe",
  "intl_namerica",
  "intl_samerica",
  "intl_africa",
  "intl_oceania",
] as const;

export default function DeliverySettingsManager() {
  const { settings, loading, saveSettings } = useDeliverySettings();
  const [draft, setDraft] = useState<DeliverySettings | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!initialized && !loading) {
    setDraft({ ...settings });
    setInitialized(true);
  }

  const update = (patch: Partial<DeliverySettings>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setSuccess(false);
  };

  const updateZone = (key: string, field: keyof ZoneDef, value: string | number) => {
    if (!draft) return;
    const zone = draft.zones[key];
    if (!zone) return;
    setDraft({
      ...draft,
      zones: {
        ...draft.zones,
        [key]: { ...zone, [field]: value },
      },
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (draft.freeDeliveryThreshold < 0) {
      setError("Free delivery threshold cannot be negative.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    for (const key of ZONE_KEYS) {
      const z = draft.zones[key];
      if (!z || z.rate < 0 || z.perItem < 0) {
        setError(`Invalid rate for zone "${z?.label || key}".`);
        setTimeout(() => setError(null), 3000);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await saveSettings(draft);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#171813]">Delivery Settings</h2>
        <p className="text-sm text-[#595B53] mt-1">
          Configure shipping rates per zone and free delivery threshold.
        </p>
      </div>

      {/* Free Delivery Threshold */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-5">
        <p className="text-xs font-medium text-[#595B53] uppercase tracking-wider mb-3">
          Free Delivery Threshold
        </p>
        <p className="text-sm text-[#595B53] mb-4">
          Orders above this value get free delivery. Set to 0 to disable free delivery.
        </p>
        <div className="flex items-center gap-3 max-w-xs">
          <span className="text-sm text-[#595B53]">RM</span>
          <input
            type="number"
            min={0}
            step={50}
            value={draft.freeDeliveryThreshold}
            onChange={(e) =>
              update({ freeDeliveryThreshold: Math.max(0, Number(e.target.value) || 0) })
            }
            className="flex-1 border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#171813]/30 focus:border-[#171813]"
          />
        </div>
      </div>

      {/* Zone Rates */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-5">
        <p className="text-xs font-medium text-[#595B53] uppercase tracking-wider mb-3">
          Shipping Zone Rates
        </p>
        <p className="text-sm text-[#595B53] mb-4">
          Base rate is charged for the first item. Per-item rate applies to each additional item. Service tax (8%) is applied on top automatically.
        </p>

        <div className="space-y-4">
          {ZONE_KEYS.map((key) => {
            const zone = draft.zones[key];
            if (!zone) return null;
            return (
              <div
                key={key}
                className="border border-[#F1EEE7] rounded-lg p-4 bg-[#F1EEE7]/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#171813]">
                      {zone.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#9B998F] bg-[#F1EEE7] px-1.5 py-0.5 rounded">
                      {key}
                    </span>
                  </div>
                  <span className="text-xs text-[#9B998F]">{zone.days} days</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#595B53] mb-1">
                      Base Rate (RM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={zone.rate}
                      onChange={(e) =>
                        updateZone(key, "rate", Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#171813]/30 focus:border-[#171813]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#595B53] mb-1">
                      Per Item (RM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={zone.perItem}
                      onChange={(e) =>
                        updateZone(key, "perItem", Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#171813]/30 focus:border-[#171813]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#595B53] mb-1">
                      Est. Days
                    </label>
                    <input
                      type="text"
                      value={zone.days}
                      onChange={(e) => updateZone(key, "days", e.target.value)}
                      className="w-full border border-[#E1DFDC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#171813]/30 focus:border-[#171813]"
                      placeholder="e.g. 3-5"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          Delivery settings saved successfully.
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#171813] text-white text-sm font-medium rounded-lg hover:bg-[#171813] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
