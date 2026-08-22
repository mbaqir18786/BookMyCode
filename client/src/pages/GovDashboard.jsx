import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useCurrentUser } from '../context/CurrentUserContext';
import { Flame, AlertTriangle, ShieldAlert, CheckCircle2, MapPin, Search, FileText, UserCheck, Clock, Layers } from 'lucide-react';
import API_BASE_URL from '../config/api';

// Custom Leaflet Fire Icon Fix
const fireIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const repeatOffenderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function GovDashboard() {
  const { currentUser } = useCurrentUser();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState('Ludhiana');

  // Selected Incident Detail Drawer
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [incidentDetail, setIncidentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Officer Action Form
  const [actionType, setActionType] = useState('Field Outreach & Counseling');
  const [officerNotes, setOfficerNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Map view center
  const districtCenters = {
    Ludhiana: [30.901, 75.8573],
    Sangrur: [30.2458, 75.8421],
    Patiala: [30.3398, 76.3869],
    Bathinda: [30.211, 74.9455],
    Ferozepur: [30.9237, 74.6114]
  };

  const currentCenter = districtCenters[district] || [30.901, 75.8573];

  const [dbDistricts, setDbDistricts] = useState(['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Sangrur', 'Bathinda', 'Ferozepur', 'Moga', 'Hoshiarpur', 'Faridkot']);

  useEffect(() => {
    fetchIncidents();
    fetchOptions();
  }, [district]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/options`);
      if (res.ok) {
        const data = await res.json();
        if (data.districts && data.districts.length > 0) {
          setDbDistricts(data.districts);
        }
      }
    } catch (e) {
      console.error('Failed to fetch options in GovDashboard:', e);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents?district=${district}`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openIncidentModal = async (id) => {
    setSelectedIncidentId(id);
    try {
      setDetailLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIncidentDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncidentId || !officerNotes) return;

    try {
      setSubmittingAction(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents/${selectedIncidentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          officer_notes: officerNotes,
          status: 'action_taken',
          admin_id: currentUser.id
        })
      });

      if (res.ok) {
        setOfficerNotes('');
        openIncidentModal(selectedIncidentId);
        fetchIncidents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Government Banner */}
      <div className="neo-box p-6 bg-[#FFEDD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="neo-badge bg-[#C2410C] text-white">DISTRICT AGRICULTURE OFFICERS (DAO)</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A] mt-1">Satellite Incident Monitoring & GIS Map</h1>
          <p className="font-semibold text-sm text-gray-800">
            Active DAO: <span className="font-bold underline">{currentUser.name}</span> | District: <span className="font-bold underline">{district}</span>
          </p>
        </div>

        {/* District Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-black uppercase">Select District:</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="neo-input text-xs py-1.5 w-40 bg-white"
          >
            {dbDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive GIS Fire Hotspot Map */}
      <div className="neo-box p-4 bg-white space-y-3 border-4 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center space-x-2 font-black uppercase text-base">
            <Layers className="w-5 h-5 text-[#C2410C]" />
            <span>Interactive Fire Hotspot Map ({district} District)</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-extrabold">
            <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-red-600 rounded-full border border-black"></span> <span>Critical Fire Hotspot</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-black rounded-full border border-white"></span> <span>Repeat Offender Plot</span></span>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="h-[400px] w-full border-2 border-black neo-box-static overflow-hidden relative z-0">
          <MapContainer
            key={district}
            center={currentCenter}
            zoom={11}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {incidents.map((inc) => (
              <React.Fragment key={inc.id}>
                {/* Visual radius ring around fire incident */}
                <CircleMarker
                  center={[inc.latitude, inc.longitude]}
                  radius={20}
                  pathOptions={{
                    color: inc.repeat_offender_flag === 1 ? '#000000' : '#C2410C',
                    fillColor: inc.repeat_offender_flag === 1 ? '#000000' : '#DC2626',
                    fillOpacity: 0.35,
                    weight: 3
                  }}
                />

                {/* Marker with Interactive Popup */}
                <Marker
                  position={[inc.latitude, inc.longitude]}
                  icon={inc.repeat_offender_flag === 1 ? repeatOffenderIcon : fireIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-2 font-sans text-xs">
                      <div className="font-extrabold text-sm uppercase text-[#C2410C]">
                        🔥 {inc.farm_name || 'Satellite Hotspot'}
                      </div>
                      <p className="font-semibold text-gray-800">
                        Farmer: {inc.farmer_name || 'Unregistered Plot'}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        GPS: {inc.latitude}, {inc.longitude}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        Satellite: {inc.satellite_source} ({inc.detected_at})
                      </p>
                      {inc.repeat_offender_flag === 1 && (
                        <div className="bg-black text-yellow-300 font-extrabold text-[10px] p-1 uppercase text-center border border-black">
                          ⚠️ REPEAT OFFENDER LOCATION
                        </div>
                      )}
                      <button
                        onClick={() => openIncidentModal(inc.id)}
                        className="neo-btn neo-btn-danger text-[11px] w-full py-1.5 font-bold uppercase mt-2"
                      >
                        LOG OFFICER ACTION
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Incidents Table / List View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-4 border-black pb-2">
          <h2 className="text-2xl font-black uppercase flex items-center space-x-2">
            <Flame className="w-6 h-6 text-[#C2410C]" />
            <span>Fire Anomaly Records ({incidents.length})</span>
          </h2>
          <span className="neo-badge bg-red-600 text-white">VIIRS / MODIS SATELLITE FEED</span>
        </div>

        {loading ? (
          <div className="neo-box p-8 text-center bg-gray-100 font-bold">Querying satellite detection feeds...</div>
        ) : incidents.length === 0 ? (
          <div className="neo-empty-state space-y-3">
            <h3 className="text-xl font-black uppercase">No Active Fire Incidents in {district}</h3>
            <p className="font-semibold text-sm text-gray-700">Zero satellite fire anomalies registered in this district for the current harvest window.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {incidents.map((inc) => (
              <div key={inc.id} className="neo-box p-6 bg-white flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`neo-badge ${inc.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                      SEVERITY: {inc.severity}
                    </span>
                    {inc.repeat_offender_flag === 1 && (
                      <span className="neo-badge bg-black text-yellow-300 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>REPEAT OFFENDER LOCATION</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black uppercase text-[#0F172A]">
                      {inc.farm_name || 'Unregistered Plot Anomaly'}
                    </h3>
                    <p className="text-xs font-semibold text-gray-600">
                      Farmer: {inc.farmer_name || 'Unknown'} {inc.farmer_phone ? `(${inc.farmer_phone})` : ''}
                    </p>
                  </div>

                  <div className="text-xs font-semibold text-gray-700 bg-gray-50 p-3 border-2 border-black space-y-1">
                    <p className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span>GPS: {inc.latitude}, {inc.longitude} (District: {inc.district})</span>
                    </p>
                    <p className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                      <span>Satellite Signal: {inc.satellite_source} @ {inc.detected_at}</span>
                    </p>
                    <p className="pt-1 font-bold text-gray-900 border-t border-gray-300">
                      Status: <span className="uppercase text-[#C2410C]">{inc.status}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openIncidentModal(inc.id)}
                  className="neo-btn neo-btn-danger text-xs w-full py-2.5 flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>VIEW HISTORICAL CONTEXT & LOG ACTION</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail & Action Logging Drawer */}
      {selectedIncidentId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="neo-box p-6 bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-[8px_8px_0px_#0F172A] border-4 border-[#0F172A]">
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <div>
                <span className="neo-badge bg-[#C2410C] text-white">INCIDENT INVESTIGATION</span>
                <h3 className="text-2xl font-black uppercase text-[#0F172A]">Hotspot #{selectedIncidentId}</h3>
              </div>
              <button onClick={() => setSelectedIncidentId(null)} className="font-bold text-xl neo-btn bg-gray-200 p-1">✕</button>
            </div>

            {detailLoading || !incidentDetail ? (
              <div className="p-8 text-center font-bold">Fetching location history and nearby equipment context...</div>
            ) : (
              <div className="space-y-6">
                {/* Historical Context Breakdown */}
                <div className="p-4 bg-yellow-50 border-2 border-black space-y-2 text-xs font-bold">
                  <h4 className="text-sm font-black uppercase text-gray-900 border-b border-black pb-1">
                    1. Historical Location & Resource Context
                  </h4>
                  <p>Farm Plot: <strong>{incidentDetail.incident.farm_name || 'N/A'}</strong> ({incidentDetail.incident.area_acres || '10'} Acres)</p>
                  <p>Repeat Offender History: {incidentDetail.history.length > 0 ? `⚠️ ${incidentDetail.history.length} prior fire incident(s) detected at this location.` : 'No prior fire records on file.'}</p>
                </div>

                {/* Nearby Resource Gap Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-3 bg-green-50 border-2 border-black space-y-1">
                    <span className="font-black uppercase text-green-900">Nearby Machinery Providers ({incidentDetail.nearby_machinery.length})</span>
                    {incidentDetail.nearby_machinery.length === 0 ? (
                      <p className="text-red-700 font-bold">❌ Resource Deficit: 0 machine providers within 30 km radius!</p>
                    ) : (
                      incidentDetail.nearby_machinery.map((m) => (
                        <p key={m.id}>• {m.name} ({m.business_name}) - {m.distance_km} km away</p>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-yellow-50 border-2 border-black space-y-1">
                    <span className="font-black uppercase text-yellow-900">Nearby Bio-Residue Buyers ({incidentDetail.nearby_buyers.length})</span>
                    {incidentDetail.nearby_buyers.length === 0 ? (
                      <p className="text-red-700 font-bold">❌ Buyer Deficit: 0 buyers within 50 km radius!</p>
                    ) : (
                      incidentDetail.nearby_buyers.map((b) => (
                        <p key={b.id}>• {b.business_name} - ₹{b.price_per_ton}/ton ({b.distance_km} km away)</p>
                      ))
                    )}
                  </div>
                </div>

                {/* Action Log Form */}
                <form onSubmit={handleActionSubmit} className="neo-box p-4 bg-gray-50 border-2 border-black space-y-3">
                  <h4 className="font-black text-sm uppercase">2. Log District Officer Action</h4>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase">Action Category</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="neo-input text-xs"
                    >
                      <option value="Field Outreach & Counseling">Field Outreach & Counseling</option>
                      <option value="Emergency Mobile CHC Seeder Dispatch">Emergency Mobile CHC Seeder Dispatch</option>
                      <option value="Field Inspection & Challan Audit">Field Inspection & Challan Audit</option>
                      <option value="Biomass Collection Connection">Biomass Collection Connection</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase">Officer Notes & Resolution Summary *</label>
                    <textarea
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="Enter specific field action details taken by agricultural team..."
                      rows="3"
                      className="neo-input text-xs"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="neo-btn neo-btn-primary w-full text-xs py-2.5"
                  >
                    {submittingAction ? 'Logging Action...' : 'SUBMIT ACTION TO AUDIT LOG'}
                  </button>
                </form>

                {/* Previous Officer Action Log */}
                {incidentDetail.incident.officer_action && (
                  <div className="p-3 bg-blue-50 border-2 border-black text-xs font-bold space-y-1">
                    <span className="uppercase text-blue-900 font-black">Logged Action History:</span>
                    <p className="text-gray-900">{incidentDetail.incident.officer_action}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
