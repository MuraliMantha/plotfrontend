import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'https://esm.sh/three@0.155.0';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

const PlotDialog = ({ selectedPlot, setSelectedPlot, setShowBookingModal, setFormData }) => {
  if (!selectedPlot) return null;

  const handleBook = () => {
    setFormData({ plotNo: selectedPlot.plotNo, area: selectedPlot.area, name: '', contact: '' });
    setShowBookingModal(true);
    setSelectedPlot(null);
  };

  const isAvailable = (selectedPlot.status || '').toLowerCase() === 'available';

  return (
    <Modal show={!!selectedPlot} onHide={() => setSelectedPlot(null)} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Plot Number <span style={{ color: '#27ae60' }}>{selectedPlot.plotNo}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ marginBottom: '10px' }}>
          <b>Status:</b> {selectedPlot.status}
        </div>
        <div>
          <b>Facing:</b> {selectedPlot.facing ?? ''}
        </div>
        <div>
          <b>Measurements:</b> {selectedPlot.measurements ?? ''}
        </div>
        <div>
          <b>Area:</b> {selectedPlot.area ?? ''}
        </div>
        <div>
          <b>Boundaries:</b> {selectedPlot.boundaries ?? ''}
        </div>
        <div>
          <b>Notes:</b> {selectedPlot.notes ?? ''}
        </div>
        <div>
          <b>Plot Type(s):</b> {selectedPlot.plotTypes ?? ''}
        </div>
        <div>
          <b>Pricing:</b> ₹{selectedPlot.price?.toLocaleString()}
        </div>
        <div>
          <b>Survey No:</b> {selectedPlot.surveyNo ?? ''}
        </div>
        <div>
          <b>Plot Location (Pin):</b> {selectedPlot.locationPin ?? ''}
        </div>
        <div style={{ marginTop: '12px' }}>
          <b>Site Address & Location:</b>
          <br />
          <span style={{ color: '#009944', fontWeight: 600 }}>📍 {selectedPlot.address ?? ''}</span>
        </div>
        {isAvailable && (
          <div style={{ textAlign: 'center', marginTop: '2.2em' }}>
            <Button
              onClick={handleBook}
              style={{
                background: '#27ae60',
                color: '#fff',
                fontWeight: 700,
                padding: '13px 38px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.18em',
                boxShadow: '0 3px 12px #1c964644',
              }}
            >
              Book This Plot
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PlotDialog