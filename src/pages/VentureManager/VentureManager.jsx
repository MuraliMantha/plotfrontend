import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Text, Group } from 'react-konva';

const API_BASE = 'http://localhost:5000/api';

// Custom hook for dynamic image loading for Konva
const useKonvaImage = (url) => {
    const [image, setImage] = useState(null);

    useEffect(() => {
        if (!url) {
            setImage(null);
            return;
        }
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setImage(img);
        img.src = url;
    }, [url]);

    return image;
};

const VentureManager = () => {
    const navigate = useNavigate();
    const [ventures, setVentures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCalibrationModal, setShowCalibrationModal] = useState(false);
    const [selectedVenture, setSelectedVenture] = useState(null);

    // Create form state
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        imageData: null,
        imageName: '',
        bounds: { width: 0, height: 0 },
        location: {
            address: '',
            city: '',
            state: '',
            pincode: ''
        }
    });

    // Visual Calibration state
    const [calibrationStep, setCalibrationStep] = useState(1);
    const [calibrationData, setCalibrationData] = useState({
        origin: { x: 0, y: 0 },
        scale: { referencePixels: 100, referenceUnits: 10, unit: 'sqyd' }
    });
    const [scalePoints, setScalePoints] = useState([]); // For drawing scale reference line
    const [referenceDistance, setReferenceDistance] = useState('');

    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Konva image for calibration
    const calibrationImageUrl = selectedVenture ? `http://localhost:5000${selectedVenture.imageUrl}` : null;
    const calibrationImage = useKonvaImage(calibrationImageUrl);

    // Calculate canvas size for calibration
    const getCalibrationCanvasSize = () => {
        if (!selectedVenture?.bounds) return { width: 600, height: 400 };
        const maxWidth = 700;
        const maxHeight = 450;
        const aspectRatio = selectedVenture.bounds.width / selectedVenture.bounds.height;

        if (aspectRatio > maxWidth / maxHeight) {
            return { width: maxWidth, height: maxWidth / aspectRatio };
        } else {
            return { width: maxHeight * aspectRatio, height: maxHeight };
        }
    };

    // Fetch ventures
    const fetchVentures = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/ventures`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setVentures(data.data);
            }
        } catch (err) {
            setError('Failed to load ventures');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchVentures();
    }, [navigate, fetchVentures]);

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setCreateForm(prev => ({
                    ...prev,
                    imageData: event.target.result,
                    imageName: file.name,
                    bounds: { width: img.width, height: img.height }
                }));
                setImagePreview(event.target.result);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Create venture
    const handleCreateVenture = async () => {
        if (!createForm.name || !createForm.imageData) {
            setError('Name and image are required');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/ventures`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(createForm)
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Venture created successfully!');
                setShowCreateModal(false);
                resetCreateForm();
                fetchVentures();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to create venture');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Reset create form
    const resetCreateForm = () => {
        setCreateForm({
            name: '',
            description: '',
            imageData: null,
            imageName: '',
            bounds: { width: 0, height: 0 },
            location: { address: '', city: '', state: '', pincode: '' }
        });
        setImagePreview(null);
    };

    // Open calibration modal
    const openCalibration = (venture) => {
        setSelectedVenture(venture);
        setCalibrationStep(1);
        setCalibrationData({
            origin: venture.calibration?.origin || { x: 0, y: 0 },
            scale: venture.calibration?.scale || { referencePixels: 100, referenceUnits: 10, unit: 'sqyd' }
        });
        setScalePoints([]);
        setReferenceDistance('');
        setShowCalibrationModal(true);
    };

    // Handle canvas click for calibration
    const handleCalibrationClick = (e) => {
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        const canvasSize = getCalibrationCanvasSize();

        // Convert canvas coordinates back to original image coordinates
        const scaleX = selectedVenture.bounds.width / canvasSize.width;
        const scaleY = selectedVenture.bounds.height / canvasSize.height;

        const originalX = Math.round(point.x * scaleX);
        const originalY = Math.round(point.y * scaleY);

        if (calibrationStep === 1) {
            // Setting origin
            setCalibrationData(prev => ({
                ...prev,
                origin: { x: originalX, y: originalY }
            }));
        } else if (calibrationStep === 2) {
            // Drawing scale reference line
            if (scalePoints.length < 2) {
                setScalePoints([...scalePoints, { x: point.x, y: point.y, origX: originalX, origY: originalY }]);
            }
        }
    };

    // Calculate distance between scale points
    const calculateScaleDistance = () => {
        if (scalePoints.length === 2) {
            const dx = scalePoints[1].origX - scalePoints[0].origX;
            const dy = scalePoints[1].origY - scalePoints[0].origY;
            return Math.round(Math.sqrt(dx * dx + dy * dy));
        }
        return 0;
    };

    // Save calibration
    const handleSaveCalibration = async () => {
        if (!selectedVenture) return;

        // Update scale reference pixels from drawn line
        const pixelDistance = calculateScaleDistance();
        const updatedCalibration = {
            origin: calibrationData.origin,
            scale: {
                referencePixels: pixelDistance || calibrationData.scale.referencePixels,
                referenceUnits: parseFloat(referenceDistance) || calibrationData.scale.referenceUnits,
                unit: calibrationData.scale.unit
            }
        };

        setSubmitting(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/ventures/${selectedVenture._id}/calibration`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updatedCalibration)
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Calibration saved successfully!');
                setShowCalibrationModal(false);
                fetchVentures();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to save calibration');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Set default venture
    const handleSetDefault = async (ventureId) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/ventures/${ventureId}/set-default`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Default venture updated!');
                fetchVentures();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to set default venture');
        }
    };

    // Delete venture
    const handleDeleteVenture = async (ventureId) => {
        if (!window.confirm('Are you sure you want to delete this venture? All associated plots will remain but be unlinked.')) {
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_BASE}/ventures/${ventureId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Venture deleted successfully!');
                fetchVentures();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete venture');
        }
    };

    const canvasSize = getCalibrationCanvasSize();

    return (
        <Container fluid style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px',
                        padding: '2rem',
                        color: 'white',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                    🏘️ Venture Manager
                                </h1>
                                <p style={{ opacity: 0.9, marginBottom: 0 }}>
                                    Manage multiple ventures with custom images and visual calibration
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                ➕ Add New Venture
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    {success}
                </Alert>
            )}

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <Card.Body>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: '#dbeafe', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.5rem'
                                }}>
                                    🏢
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                                        {ventures.length}
                                    </h3>
                                    <p style={{ color: '#64748b', margin: 0 }}>Total Ventures</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <Card.Body>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: '#dcfce7', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.5rem'
                                }}>
                                    ✅
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                                        {ventures.filter(v => v.calibration?.isCalibrated).length}
                                    </h3>
                                    <p style={{ color: '#64748b', margin: 0 }}>Calibrated</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <Card.Body>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: '#fef3c7', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.5rem'
                                }}>
                                    📊
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                                        {ventures.reduce((sum, v) => sum + (v.metadata?.totalPlots || 0), 0)}
                                    </h3>
                                    <p style={{ color: '#64748b', margin: 0 }}>Total Plots</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Ventures Grid */}
            <Row>
                {loading ? (
                    <Col className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">Loading ventures...</p>
                    </Col>
                ) : ventures.length === 0 ? (
                    <Col className="text-center py-5">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏗️</div>
                        <h4>No Ventures Yet</h4>
                        <p className="text-muted">Create your first venture to get started</p>
                        <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            style={{ borderRadius: '8px' }}
                        >
                            ➕ Create First Venture
                        </Button>
                    </Col>
                ) : (
                    ventures.map(venture => (
                        <Col lg={4} md={6} key={venture._id} className="mb-4">
                            <Card style={{
                                borderRadius: '16px',
                                border: venture.isDefault ? '2px solid #667eea' : '1px solid #e2e8f0',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                boxShadow: venture.isDefault ? '0 4px 20px rgba(102, 126, 234, 0.2)' : 'none'
                            }}>
                                {/* Image Preview */}
                                <div style={{
                                    height: '160px',
                                    background: `url(http://localhost:5000${venture.imageUrl}) center/cover`,
                                    position: 'relative'
                                }}>
                                    {venture.isDefault && (
                                        <Badge
                                            bg="primary"
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                borderRadius: '20px',
                                                padding: '0.5rem 1rem'
                                            }}
                                        >
                                            ⭐ Default
                                        </Badge>
                                    )}
                                    {venture.calibration?.isCalibrated && (
                                        <Badge
                                            bg="success"
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                left: '10px',
                                                borderRadius: '20px',
                                                padding: '0.5rem 1rem'
                                            }}
                                        >
                                            ✓ Calibrated
                                        </Badge>
                                    )}
                                </div>

                                <Card.Body>
                                    <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{venture.name}</h5>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                        {venture.description || 'No description'}
                                    </p>

                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        <Badge bg="secondary" style={{ borderRadius: '8px' }}>
                                            📐 {venture.bounds?.width}x{venture.bounds?.height}px
                                        </Badge>
                                        <Badge bg="info" style={{ borderRadius: '8px' }}>
                                            📊 {venture.metadata?.totalPlots || 0} plots
                                        </Badge>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => openCalibration(venture)}
                                            style={{ flex: 1, borderRadius: '8px' }}
                                        >
                                            ⚙️ Calibrate
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={venture.isDefault ? 'secondary' : 'outline-success'}
                                            onClick={() => handleSetDefault(venture._id)}
                                            disabled={venture.isDefault}
                                            style={{ flex: 1, borderRadius: '8px' }}
                                        >
                                            {venture.isDefault ? '✓ Default' : '⭐ Set Default'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => handleDeleteVenture(venture._id)}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            🗑️
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>

            {/* Create Venture Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none'
                }}>
                    <Modal.Title>🏘️ Create New Venture</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '2rem' }}>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: '600' }}>Venture Name *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., Sunrise Valley Phase 2"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                style={{ borderRadius: '8px', padding: '0.75rem' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: '600' }}>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Brief description of the venture..."
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: '600' }}>Site Plan Image *</Form.Label>
                            <div
                                style={{
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: imagePreview ? 'transparent' : '#f8fafc'
                                }}
                                onClick={() => document.getElementById('venture-image-input').click()}
                            >
                                {imagePreview ? (
                                    <div>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                                        />
                                        <p style={{ marginTop: '1rem', marginBottom: 0 }}>
                                            📐 {createForm.bounds.width} x {createForm.bounds.height} pixels
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                                        <p style={{ marginBottom: 0 }}>Click or drag to upload site plan image</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="venture-image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={createForm.location.city}
                                        onChange={(e) => setCreateForm(prev => ({
                                            ...prev,
                                            location: { ...prev.location, city: e.target.value }
                                        }))}
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={createForm.location.state}
                                        onChange={(e) => setCreateForm(prev => ({
                                            ...prev,
                                            location: { ...prev.location, state: e.target.value }
                                        }))}
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreateVenture}
                        disabled={submitting || !createForm.name || !createForm.imageData}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none'
                        }}
                    >
                        {submitting ? <Spinner size="sm" /> : '✨ Create Venture'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Visual Calibration Modal */}
            <Modal show={showCalibrationModal} onHide={() => setShowCalibrationModal(false)} size="xl" centered>
                <Modal.Header closeButton style={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    color: 'white',
                    border: 'none'
                }}>
                    <Modal.Title>
                        ⚙️ Visual Calibration: {selectedVenture?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem', background: '#f8fafc' }}>
                    {/* Step Indicator */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            {[
                                { step: 1, label: '📍 Set Origin', desc: 'Click on the image to mark reference point' },
                                { step: 2, label: '📏 Set Scale', desc: 'Draw a line and enter real-world distance' },
                                { step: 3, label: '✅ Confirm', desc: 'Review and save calibration' }
                            ].map(({ step, label }) => (
                                <div
                                    key={step}
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '0.75rem',
                                        background: calibrationStep >= step
                                            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                            : '#e2e8f0',
                                        color: calibrationStep >= step ? 'white' : '#64748b',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => step <= calibrationStep && setCalibrationStep(step)}
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Row>
                        {/* Canvas Column */}
                        <Col lg={8}>
                            <Card style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <Card.Body style={{ padding: '0', background: '#1e293b' }}>
                                    <Stage
                                        width={canvasSize.width}
                                        height={canvasSize.height}
                                        onClick={handleCalibrationClick}
                                        style={{ cursor: 'crosshair' }}
                                    >
                                        <Layer>
                                            {/* Venture Image */}
                                            {calibrationImage && (
                                                <KonvaImage
                                                    image={calibrationImage}
                                                    width={canvasSize.width}
                                                    height={canvasSize.height}
                                                />
                                            )}

                                            {/* Origin Marker */}
                                            {calibrationData.origin.x > 0 && selectedVenture && (
                                                <Group>
                                                    <Circle
                                                        x={(calibrationData.origin.x / selectedVenture.bounds.width) * canvasSize.width}
                                                        y={(calibrationData.origin.y / selectedVenture.bounds.height) * canvasSize.height}
                                                        radius={12}
                                                        fill="rgba(239, 68, 68, 0.8)"
                                                        stroke="#fff"
                                                        strokeWidth={3}
                                                    />
                                                    <Text
                                                        x={(calibrationData.origin.x / selectedVenture.bounds.width) * canvasSize.width + 16}
                                                        y={(calibrationData.origin.y / selectedVenture.bounds.height) * canvasSize.height - 8}
                                                        text="Origin"
                                                        fontSize={14}
                                                        fill="#fff"
                                                        fontStyle="bold"
                                                    />
                                                </Group>
                                            )}

                                            {/* Scale Reference Line */}
                                            {scalePoints.length >= 2 && (
                                                <>
                                                    <Line
                                                        points={[scalePoints[0].x, scalePoints[0].y, scalePoints[1].x, scalePoints[1].y]}
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        dash={[8, 4]}
                                                    />
                                                    <Circle
                                                        x={scalePoints[0].x}
                                                        y={scalePoints[0].y}
                                                        radius={8}
                                                        fill="#3b82f6"
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                    <Circle
                                                        x={scalePoints[1].x}
                                                        y={scalePoints[1].y}
                                                        radius={8}
                                                        fill="#3b82f6"
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                    <Text
                                                        x={(scalePoints[0].x + scalePoints[1].x) / 2}
                                                        y={(scalePoints[0].y + scalePoints[1].y) / 2 - 20}
                                                        text={`${calculateScaleDistance()} px`}
                                                        fontSize={14}
                                                        fill="#fff"
                                                        fontStyle="bold"
                                                    />
                                                </>
                                            )}

                                            {/* Single scale point */}
                                            {scalePoints.length === 1 && (
                                                <Circle
                                                    x={scalePoints[0].x}
                                                    y={scalePoints[0].y}
                                                    radius={8}
                                                    fill="#3b82f6"
                                                    stroke="#fff"
                                                    strokeWidth={2}
                                                />
                                            )}
                                        </Layer>
                                    </Stage>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Controls Column */}
                        <Col lg={4}>
                            <Card style={{ borderRadius: '12px', height: '100%' }}>
                                <Card.Body>
                                    {calibrationStep === 1 && (
                                        <>
                                            <h5 style={{ fontWeight: '600', marginBottom: '1rem' }}>📍 Step 1: Set Origin</h5>
                                            <p className="text-muted mb-3">
                                                Click on the image to set the origin point. This will be used as a reference for all plot coordinates.
                                            </p>
                                            <div style={{
                                                background: '#f1f5f9',
                                                padding: '1rem',
                                                borderRadius: '10px',
                                                marginBottom: '1rem'
                                            }}>
                                                <p className="mb-1"><strong>Current Origin:</strong></p>
                                                <Badge bg="primary" style={{ fontSize: '1rem' }}>
                                                    X: {calibrationData.origin.x}px, Y: {calibrationData.origin.y}px
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setCalibrationData(prev => ({ ...prev, origin: { x: 0, y: 0 } }))}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                ↩ Reset Origin
                                            </Button>
                                        </>
                                    )}

                                    {calibrationStep === 2 && (
                                        <>
                                            <h5 style={{ fontWeight: '600', marginBottom: '1rem' }}>📏 Step 2: Set Scale</h5>
                                            <p className="text-muted mb-3">
                                                Click two points on the image to draw a reference line, then enter the real-world distance.
                                            </p>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <Badge bg={scalePoints.length === 0 ? 'warning' : scalePoints.length === 1 ? 'info' : 'success'}>
                                                    {scalePoints.length === 0 && '⏳ Click first point'}
                                                    {scalePoints.length === 1 && '⏳ Click second point'}
                                                    {scalePoints.length === 2 && `✓ ${calculateScaleDistance()} pixels`}
                                                </Badge>
                                            </div>

                                            {scalePoints.length === 2 && (
                                                <Form.Group className="mb-3">
                                                    <Form.Label style={{ fontWeight: '600' }}>Real-world distance</Form.Label>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <Form.Control
                                                            type="number"
                                                            placeholder="e.g., 50"
                                                            value={referenceDistance}
                                                            onChange={(e) => setReferenceDistance(e.target.value)}
                                                            style={{ borderRadius: '8px' }}
                                                        />
                                                        <Form.Select
                                                            value={calibrationData.scale.unit}
                                                            onChange={(e) => setCalibrationData(prev => ({
                                                                ...prev,
                                                                scale: { ...prev.scale, unit: e.target.value }
                                                            }))}
                                                            style={{ borderRadius: '8px', maxWidth: '120px' }}
                                                        >
                                                            <option value="sqyd">sq.yd</option>
                                                            <option value="meters">m</option>
                                                            <option value="feet">ft</option>
                                                        </Form.Select>
                                                    </div>
                                                </Form.Group>
                                            )}

                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setScalePoints([])}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                ↩ Clear Line
                                            </Button>
                                        </>
                                    )}

                                    {calibrationStep === 3 && (
                                        <>
                                            <h5 style={{ fontWeight: '600', marginBottom: '1rem' }}>✅ Step 3: Confirm</h5>
                                            <p className="text-muted mb-3">
                                                Review your calibration settings before saving.
                                            </p>

                                            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '10px' }}>
                                                <p className="mb-2">
                                                    <strong>Origin:</strong><br />
                                                    ({calibrationData.origin.x}, {calibrationData.origin.y})
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Scale:</strong><br />
                                                    {calculateScaleDistance() || calibrationData.scale.referencePixels}px = {referenceDistance || calibrationData.scale.referenceUnits} {calibrationData.scale.unit}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    {calibrationStep > 1 && (
                        <Button variant="outline-secondary" onClick={() => setCalibrationStep(prev => prev - 1)}>
                            ← Previous
                        </Button>
                    )}
                    {calibrationStep < 3 ? (
                        <Button
                            variant="primary"
                            onClick={() => setCalibrationStep(prev => prev + 1)}
                            disabled={calibrationStep === 1 && calibrationData.origin.x === 0}
                            style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}
                        >
                            Next →
                        </Button>
                    ) : (
                        <Button
                            variant="success"
                            onClick={handleSaveCalibration}
                            disabled={submitting}
                            style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}
                        >
                            {submitting ? <Spinner size="sm" /> : '💾 Save Calibration'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default VentureManager;
