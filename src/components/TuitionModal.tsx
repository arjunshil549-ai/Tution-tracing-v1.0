import React, { useState } from 'react';
import { Tuition } from '../types';
import { MapPicker } from './MapPicker';
import { MapPin, Clock, DollarSign, Shield, X, Check, Navigation } from 'lucide-react';

interface TuitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tuitionData: Omit<Tuition, 'id' | 'createdAt'>, existingId?: number) => void;
  editingTuition?: Tuition | null;
}

const DAYS_OPTIONS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

export const TuitionModal: React.FC<TuitionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTuition,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(editingTuition?.name || '');
  const [studentName, setStudentName] = useState(editingTuition?.studentName || '');
  const [address, setAddress] = useState(editingTuition?.address || 'Farmgate, Dhaka');
  const [latitude, setLatitude] = useState(editingTuition?.latitude || 23.7563);
  const [longitude, setLongitude] = useState(editingTuition?.longitude || 90.3891);
  const [radius, setRadius] = useState(editingTuition?.radius || 100);
  const [expectedStart, setExpectedStart] = useState(editingTuition?.expectedStart || '16:00');
  const [expectedEnd, setExpectedEnd] = useState(editingTuition?.expectedEnd || '18:00');
  const [fee, setFee] = useState(editingTuition?.fee || 8000);
  const [expectedClasses, setExpectedClasses] = useState(editingTuition?.expectedClassesPerMonth || 10);
  const [minimumStayMinutes, setMinimumStayMinutes] = useState(editingTuition?.minimumStayMinutes || 30);
  const [scheduledDays, setScheduledDays] = useState<number[]>(
    editingTuition?.scheduledDays || [1, 3, 5]
  );
  const [active, setActive] = useState(editingTuition?.active ?? true);

  const [showMapPicker, setShowMapPicker] = useState(false);

  const toggleDay = (dayId: number) => {
    if (scheduledDays.includes(dayId)) {
      setScheduledDays(scheduledDays.filter((d) => d !== dayId));
    } else {
      setScheduledDays([...scheduledDays, dayId].sort());
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number, pickedAddress?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (pickedAddress) {
      setAddress(pickedAddress);
    }
    setShowMapPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        studentName: studentName.trim(),
        address: address.trim(),
        latitude,
        longitude,
        radius: Number(radius),
        expectedStart,
        expectedEnd,
        fee: Number(fee),
        expectedClassesPerMonth: Number(expectedClasses),
        scheduledDays,
        minimumStayMinutes: Number(minimumStayMinutes),
        active,
      },
      editingTuition?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editingTuition ? 'Edit Tuition' : 'Add New Tuition'}
            </h2>
            <p className="text-xs text-slate-400">Configure geofence, schedule, and monthly fees</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tuition Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tuition Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Farmgate Tuition"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Student/Subject Descriptor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Student & Subject (Optional)</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Tanvir (Class 10 Physics)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Address & Map Picker Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Address & Map Location *</label>
              <span className="text-[11px] font-mono text-emerald-400">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Farmgate, Dhaka"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-950 transition whitespace-nowrap"
              >
                <MapPin className="w-4 h-4" />
                <span>Select on Map</span>
              </button>
            </div>
          </div>

          {/* Radius Slider */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Geofence Radius</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {radius} meters
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>50m (Precise)</span>
              <span>100m (Recommended)</span>
              <span>300m (Wide area)</span>
            </div>
          </div>

          {/* Expected Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Expected Start</span>
              </label>
              <input
                type="time"
                value={expectedStart}
                onChange={(e) => setExpectedStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Expected End</span>
              </label>
              <input
                type="time"
                value={expectedEnd}
                onChange={(e) => setExpectedEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Minimum stay & Monthly Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Minimum Stay (min)</label>
              <input
                type="number"
                min="10"
                max="120"
                value={minimumStayMinutes}
                onChange={(e) => setMinimumStayMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
              <span className="text-[10px] text-slate-500 block">Visits under this are ignored</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Monthly Fee (৳)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">Expected 10-12 classes</span>
            </div>
          </div>

          {/* Scheduled Days */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Scheduled Weekly Days</label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OPTIONS.map((d) => {
                const isSelected = scheduledDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`py-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enable Automatic Tracking Checkbox */}
          <div className="pt-2">
            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Enable automatic geofence tracking</span>
                <span className="text-slate-400 text-[11px]">Auto-record attendance when inside the {radius}m radius</span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>SAVE TUITION</span>
            </button>
          </div>
        </form>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
          <div className="w-full max-w-2xl h-[85vh]">
            <MapPicker
              initialLat={latitude}
              initialLng={longitude}
              radius={radius}
              onLocationSelect={handleMapLocationSelect}
              onClose={() => setShowMapPicker(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
