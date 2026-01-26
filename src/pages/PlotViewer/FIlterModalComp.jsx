import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'https://esm.sh/three@0.155.0';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

const FilterModalComp = ({ showFilterModal, setShowFilterModal, filters, setFilters }) => {
  const handleApply = () => {
    setShowFilterModal(false);
  };

  const handleReset = () => {
    setFilters({ plotNos: '', status: '', facing: '', type: '' });
    setShowFilterModal(false);
  };

  return (
    <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Filter Plots</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group style={{ margin: '15px 0 10px 0' }}>
          <Form.Label style={{ fontWeight: 600, display: 'block', marginBottom: '3px' }}>Plot Numbers</Form.Label>
          <Form.Control
            type="text"
            value={filters.plotNos}
            onChange={(e) => setFilters({ ...filters, plotNos: e.target.value })}
            placeholder="Eg: 1,24,36"
            style={{ width: '100%', fontSize: '1rem', padding: '6px 10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '2px' }}
          />
        </Form.Group>
        <Form.Group style={{ margin: '15px 0 10px 0' }}>
          <Form.Label style={{ fontWeight: 600, display: 'block', marginBottom: '3px' }}>Status</Form.Label>
          <Form.Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{ width: '100%', fontSize: '1rem', padding: '6px 10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '2px' }}
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="hold">Hold</option>
            <option value="sold">Sold</option>
            <option value="tentatively_booked">Tentatively_Booked</option>
            <option value="cip">CIP</option>
          </Form.Select>
        </Form.Group>
        <Form.Group style={{ margin: '15px 0 10px 0' }}>
          <Form.Label style={{ fontWeight: 600, display: 'block', marginBottom: '3px' }}>Facing</Form.Label>
          <Form.Select
            value={filters.facing}
            onChange={(e) => setFilters({ ...filters, facing: e.target.value })}
            style={{ width: '100%', fontSize: '1rem', padding: '6px 10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '2px' }}
          >
            <option value="">All</option>
            <option value="north">North</option>
            <option value="south">South</option>
            <option value="east">East</option>
            <option value="west">West</option>
          </Form.Select>
        </Form.Group>
        <Form.Group style={{ margin: '15px 0 10px 0' }}>
          <Form.Label style={{ fontWeight: 600, display: 'block', marginBottom: '3px' }}>Plot Type</Form.Label>
          <Form.Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            style={{ width: '100%', fontSize: '1rem', padding: '6px 10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '2px' }}
          >
            <option value="">All Types</option>
            <option value="Special Homes">Special Homes</option>
            <option value="Block - A">Block - A</option>
            <option value="House">House</option>
            <option value="INDEPENDENT BUNGALOW">INDEPENDENT BUNGALOW</option>
            <option value="TWIN BUNGALOW">TWIN BUNGALOW</option>
            <option value="ROW HOUSE">ROW HOUSE</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer style={{ marginTop: '16px', textAlign: 'right' }}>
        <Button style={{ marginRight: '8px' }} onClick={handleApply}>
          FILTER
        </Button>
        <Button onClick={handleReset}>RESET</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FilterModalComp