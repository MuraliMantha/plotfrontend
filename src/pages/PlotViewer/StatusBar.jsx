import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'https://esm.sh/three@0.155.0';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

const StatusBar = ({ geoData }) => {
  if (!geoData) return null;

  const features = geoData.features;
  const counts = { total: features.length, available: 0, hold: 0, sold: 0, tentative: 0, cip: 0 };
  features.forEach((f) => {
    let st = (f.properties.status || '').toLowerCase();
    if (st === 'available') counts.available++;
    else if (st === 'hold') counts.hold++;
    else if (st === 'sold') counts.sold++;
    else if (st === 'tentatively_booked') counts.tentative++;
    else if (st === 'cip') counts.cip++;
  });

  return (
    <div
      style={{
        marginTop: '12px',
        marginLeft: '12px',
        marginRight: '12px',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '10px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        display: 'flex',
        gap: '18px',
        alignItems: 'center',
        minHeight: '56px',
        padding: '0 4px',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontWeight: 500,
        zIndex: 2,
      }}
    >
      <Badge
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '7px',
          padding: '7px 16px',
          fontSize: '1.13em',
          fontWeight: 600,
          color: '#fff',
          background: '#17831d',
        }}
      >
        <i style={{ fontStyle: 'normal', marginRight: '4px', fontSize: '1.1em' }}>🗺️</i> Total Plots: {counts.total}
      </Badge>
      <Badge
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '7px',
          padding: '7px 16px',
          fontSize: '1.13em',
          fontWeight: 600,
          background: '#fff',
          color: '#222',
          border: '2px solid #d5d5d5',
        }}
      >
        <i style={{ fontStyle: 'normal', marginRight: '4px', fontSize: '1.1em' }}>✔️</i> Available Plots: {counts.available}
      </Badge>
      <Badge
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '7px',
          padding: '7px 16px',
          fontSize: '1.13em',
          fontWeight: 600,
          background: '#FFC85C',
          color: '#805600',
        }}
      >
        <i style={{ fontStyle: 'normal', marginRight: '4px', fontSize: '1.1em' }}>⏸️</i> Hold Plots: {counts.hold}
      </Badge>
      <Badge
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '7px',
          padding: '7px 16px',
          fontSize: '1.13em',
          fontWeight: 600,
          background: '#fd4556',
          color: '#fff',
        }}
      >
        <i style={{ fontStyle: 'normal', marginRight: '4px', fontSize: '1.1em' }}>❌</i> Sold: {counts.sold}
      </Badge>
      <Badge
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '7px',
          padding: '7px 16px',
          fontSize: '1.13em',
          fontWeight: 600,
          background: '#bb53a5',
          color: '#fff',
        }}
      >
        <i style={{ fontStyle: 'normal', marginRight: '4px', fontSize: '1.1em' }}>❎</i> Tentatively_Booked: {counts.tentative}
      </Badge>
      <Badge
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '7px',
          padding: '7px 16px',
          fontSize: '1.13em',
          fontWeight: 600,
          background: '#d2b27e',
          color: '#473c1a',
        }}
      >
        <i style={{ fontStyle: 'normal', marginRight: '4px', fontSize: '1.1em' }}>✖️</i> CIP: {counts.cip}
      </Badge>
    </div>
  );
};


export default StatusBar