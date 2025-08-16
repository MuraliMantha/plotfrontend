import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'https://esm.sh/three@0.155.0';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

const Toolbar = ({ zoom, setZoom, setCameraPos, setShowFilterModal, clamp, minZoom, maxZoom }) => {
  return (
    <div
      style={{
        position: 'fixed',
        right: '28px',
        bottom: '32px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '12px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        padding: '8px 14px',
        alignItems: 'center',
      }}
    >
      <Button
        style={{ fontSize: '1.35rem', padding: '8px 15px', borderRadius: '7px', background: '#eee', color: '#222' }}
        onClick={() => setZoom(clamp(zoom * 1.13, minZoom, maxZoom))}
        title="Zoom In"
      >
        +
      </Button>
      <Button
        style={{ fontSize: '1.35rem', padding: '8px 15px', borderRadius: '7px', background: '#eee', color: '#222' }}
        onClick={() => setZoom(clamp(zoom / 1.13, minZoom, maxZoom))}
        title="Zoom Out"
      >
        −
      </Button>
      <Button
        style={{ fontSize: '1.35rem', padding: '8px 15px', borderRadius: '7px', background: '#eee', color: '#222' }}
        onClick={() => setShowFilterModal(true)}
        title="Filter"
      >
        &#x25BC;
      </Button>
      <Button
        style={{ fontSize: '1.35rem', padding: '8px 15px', borderRadius: '7px', background: '#eee', color: '#222' }}
        onClick={() => {
          setZoom(1);
          setCameraPos({ x: 0, y: 0 });
        }}
        title="Reset Zoom"
      >
        ⟳
      </Button>
    </div>
  );
};

export default Toolbar