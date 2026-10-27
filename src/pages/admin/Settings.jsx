import React, { useState } from 'react';
import { Settings, Save, Shield, Clock, Bell, Building, MapPin } from 'lucide-react';
import Button from '../../components/common/Button';
import { useData } from '../../context/DataContext';

export default function AdminSettings() {
  const { showToast, hostelSettings, updateHostelSettings } = useData();

  const [curfewTime, setCurfewTime] = useState('22:00');
  const [allowGuestVisits, setAllowGuestVisits] = useState(true);
  const [autoApproveLeaves, setAutoApproveLeaves] = useState(false);
  const [maintenanceContact, setMaintenanceContact] = useState('+91 98234 56789');

  const [locationSettings, setLocationSettings] = useState({
    name: hostelSettings?.name || '',
    latitude: hostelSettings?.latitude || '',
    longitude: hostelSettings?.longitude || '',
    radius: hostelSettings?.radius || '',
    maxAccuracy: hostelSettings?.maxAccuracy || ''
  });

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationSettings(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        showToast('Current location fetched successfully', 'success');
      },
      (error) => {
        console.error(error);
        showToast('Failed to fetch location. Please enable location permissions.', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    const lat = parseFloat(locationSettings.latitude);
    const lon = parseFloat(locationSettings.longitude);
    const radius = parseFloat(locationSettings.radius);
    const maxAccuracy = parseFloat(locationSettings.maxAccuracy);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      showToast('Hostel latitude must be between -90 and 90 degrees.', 'warning');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      showToast('Hostel longitude must be between -180 and 180 degrees.', 'warning');
      return;
    }
    if (isNaN(radius) || radius <= 0) {
      showToast('Allowed radius must be a positive number in meters.', 'warning');
      return;
    }
    if (isNaN(maxAccuracy) || maxAccuracy <= 0) {
      showToast('Max accuracy threshold must be a positive number in meters.', 'warning');
      return;
    }

    updateHostelSettings({
      name: locationSettings.name,
      latitude: lat,
      longitude: lon,
      radius: radius,
      maxAccuracy: maxAccuracy
    });
    showToast('System configuration settings saved successfully.', 'success');
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Hostel System Settings & Policies
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Configure curfew timings, guest policies, and administrative preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
          Hostel Discipline & Curfew Rules
        </h3>

        <div className="form-group">
          <label className="form-label">Main Gate Closing / Curfew Time</label>
          <input
            type="time"
            className="form-input"
            value={curfewTime}
            onChange={(e) => setCurfewTime(e.target.value)}
            style={{ maxWidth: '240px' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Late entries beyond this time automatically flag security logs.
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
            Visitor & Leave Request Automation
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allowGuestVisits}
                onChange={(e) => setAllowGuestVisits(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-600)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                  Allow Parents and Guardians in Visitor Lounge
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Students can log expected visitors for gate security verification.
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoApproveLeaves}
                onChange={(e) => setAutoApproveLeaves(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-600)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                  Automate Weekend Day Passes
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Auto-approve leave requests under 24 hours if emergency contact is verified.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Hostel Location Settings (Geofence)
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={MapPin}
              onClick={handleGetCurrentLocation}
              style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', border: 'none' }}
            >
              Use Current Location
            </Button>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Hostel Name</label>
              <input
                type="text"
                className="form-input"
                value={locationSettings.name}
                onChange={(e) => setLocationSettings({ ...locationSettings, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Allowed Radius (meters)</label>
              <input
                type="number"
                className="form-input"
                value={locationSettings.radius}
                onChange={(e) => setLocationSettings({ ...locationSettings, radius: e.target.value })}
                min="1"
                required
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Hostel Latitude (-90 to 90)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={locationSettings.latitude}
                onChange={(e) => setLocationSettings({ ...locationSettings, latitude: e.target.value })}
                min="-90"
                max="90"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hostel Longitude (-180 to 180)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={locationSettings.longitude}
                onChange={(e) => setLocationSettings({ ...locationSettings, longitude: e.target.value })}
                min="-180"
                max="180"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Maximum Accepted Location Accuracy (meters)</label>
            <input
              type="number"
              className="form-input"
              value={locationSettings.maxAccuracy}
              onChange={(e) => setLocationSettings({ ...locationSettings, maxAccuracy: e.target.value })}
              min="1"
              required
              style={{ maxWidth: '300px' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Student location must have an accuracy value less than or equal to this to be trusted.
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Central Emergency Maintenance Helpline</label>
            <input
              type="text"
              className="form-input"
              value={maintenanceContact}
              onChange={(e) => setMaintenanceContact(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button type="submit" variant="primary" icon={Save}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
