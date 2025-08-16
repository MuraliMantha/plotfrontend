import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'https://esm.sh/three@0.155.0';
import { Modal, Button, Form, Badge } from 'react-bootstrap';


const BookingModal = ({ showBookingModal, setShowBookingModal, formData, setFormData }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3000/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.contact,
          email: '',
          message: '',
          plotNo: formData.plotNo,
        }),
      });
      alert(`Enquiry submitted!\nPlot No: ${formData.plotNo}\nArea: ${formData.area}\nName: ${formData.name}\nContact: ${formData.contact}`);
      setShowBookingModal(false);
    } catch (error) {
      console.error('Error submitting enquiry:', error);
    }
  };

  return (
    <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Book This Plot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group style={{ marginBottom: '13px' }}>
            <Form.Label>
              <b>Plot No:</b>
            </Form.Label>
            <Form.Control type="text" value={formData.plotNo} readOnly style={{ width: '100%', padding: '6px 10px' }} />
          </Form.Group>
          <Form.Group style={{ marginBottom: '13px' }}>
            <Form.Label>
              <b>Area:</b>
            </Form.Label>
            <Form.Control type="text" value={formData.area} readOnly style={{ width: '100%', padding: '6px 10px' }} />
          </Form.Group>
          <Form.Group style={{ marginBottom: '13px' }}>
            <Form.Label>
              <b>Your Name:</b>
            </Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '6px 10px' }}
            />
          </Form.Group>
          <Form.Group style={{ marginBottom: '13px' }}>
            <Form.Label>
              <b>Contact No/Email:</b>
            </Form.Label>
            <Form.Control
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
              style={{ width: '100%', padding: '6px 10px' }}
            />
          </Form.Group>
          <Button
            type="submit"
            style={{ background: '#27ae60', color: '#fff', fontWeight: 600, padding: '8px 20px', border: 'none', borderRadius: '8px', marginRight: '10px' }}
          >
            Submit Enquiry
          </Button>
          <Button
            style={{ background: '#f3f3f3', padding: '8px 18px', border: 'none', borderRadius: '8px', color: '#222' }}
            onClick={() => setShowBookingModal(false)}
          >
            Cancel
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};


export default BookingModal