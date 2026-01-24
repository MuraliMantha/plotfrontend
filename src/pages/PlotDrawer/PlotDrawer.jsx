import React, { useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle, Group } from "react-konva";
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

// Custom hook for dynamic image loading - returns image, loading state, and original dimensions
const useDynamicImage = (url) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!url) {
      setImage(null);
      setOriginalDimensions({ width: 0, height: 0 });
      return;
    }
    setLoading(true);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Store the original image dimensions
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setLoading(false);
    };
    img.onerror = () => setLoading(false);
    img.src = url;
  }, [url]);

  return [image, loading, originalDimensions];
};

const PlotDrawer = () => {
  const navigate = useNavigate();

  // Venture state
  const [ventures, setVentures] = useState([]);
  const [selectedVenture, setSelectedVenture] = useState(null);
  const [venturesLoading, setVenturesLoading] = useState(true);

  // Image - get original dimensions for coordinate scaling
  const imageUrl = selectedVenture ? `http://localhost:5000${selectedVenture.imageUrl}` : null;
  const [image, imageLoading, originalDimensions] = useDynamicImage(imageUrl);

  // Drawing state
  const [points, setPoints] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Stage dimensions - will be calculated based on actual image dimensions
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });

  // Maximum stage dimensions
  const MAX_STAGE_WIDTH = 900;
  const MAX_STAGE_HEIGHT = 600;

  // Form data - all lowercase status values
  const [formData, setFormData] = useState({
    plotNo: "",
    status: "available",
    facing: "",
    area: "",
    price: "",
    surveyNo: "",
    notes: "",
    plotTypes: ""
  });

  // Calculate scale factors for coordinate conversion
  const getScaleFactors = () => {
    if (!originalDimensions.width || !originalDimensions.height || !stageSize.width || !stageSize.height) {
      return { scaleX: 1, scaleY: 1 };
    }
    return {
      scaleX: originalDimensions.width / stageSize.width,
      scaleY: originalDimensions.height / stageSize.height
    };
  };

  // Convert stage coordinates to original image coordinates (for saving)
  const stageToImageCoords = (stageX, stageY) => {
    const { scaleX, scaleY } = getScaleFactors();
    return [stageX * scaleX, stageY * scaleY];
  };

  // Convert original image coordinates to stage coordinates (for displaying existing plots)
  const imageToStageCoords = (imageX, imageY) => {
    const { scaleX, scaleY } = getScaleFactors();
    return [imageX / scaleX, imageY / scaleY];
  };

  // Convert an entire raw points array from original image coords to stage coords
  const convertRawPointsToStage = (rawPoints) => {
    if (!rawPoints || rawPoints.length === 0) return [];
    const stagePoints = [];
    for (let i = 0; i < rawPoints.length; i += 2) {
      const [stageX, stageY] = imageToStageCoords(rawPoints[i], rawPoints[i + 1]);
      stagePoints.push(stageX, stageY);
    }
    return stagePoints;
  };

  useEffect(() => {
    fetchVentures();
  }, []);

  // Update stage size when original dimensions are available
  useEffect(() => {
    if (originalDimensions.width && originalDimensions.height) {
      // Calculate stage size to fit within max dimensions while maintaining aspect ratio
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      let newWidth = Math.min(originalDimensions.width, MAX_STAGE_WIDTH);
      let newHeight = newWidth / aspectRatio;

      if (newHeight > MAX_STAGE_HEIGHT) {
        newHeight = MAX_STAGE_HEIGHT;
        newWidth = newHeight * aspectRatio;
      }

      setStageSize({
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      });
    }
  }, [originalDimensions]);

  useEffect(() => {
    if (selectedVenture) {
      fetchPlotsForVenture(selectedVenture._id);
    } else {
      setPolygons([]);
    }
  }, [selectedVenture]);

  const fetchVentures = async () => {
    try {
      setVenturesLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/ventures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVentures(data.data);
        const defaultVenture = data.data.find(v => v.isDefault) || data.data[0];
        if (defaultVenture) setSelectedVenture(defaultVenture);
      }
    } catch (err) {
      setError("Failed to load ventures");
    } finally {
      setVenturesLoading(false);
    }
  };

  const fetchPlotsForVenture = async (ventureId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/plot?ventureId=${ventureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.features) {
        // Store raw coordinates in original image space - will be converted at render time
        setPolygons(data.features.map(f => ({
          id: f.properties._id,
          plotNo: f.properties.plotNo,
          status: f.properties.status,
          // Store raw points in original image coordinates
          rawPoints: f.geometry?.coordinates?.[0]?.flat() || []
        })));
      }
    } catch (err) {
      console.error("Error fetching plots:", err);
    }
  };

  const handleVentureChange = (e) => {
    const venture = ventures.find(v => v._id === e.target.value);
    setSelectedVenture(venture || null);
    setPoints([]);
    setShowForm(false);
  };

  const handleCanvasClick = (e) => {
    if (showForm || !selectedVenture) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setPoints([...points, point.x, point.y]);
  };

  const handleCompletePolygon = () => {
    if (points.length >= 6) {
      setShowForm(true);
      setError("");
    } else {
      setError("Need at least 3 points to complete a polygon");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUndoPoint = () => {
    if (points.length >= 2) setPoints(points.slice(0, -2));
  };

  const handleClearDrawing = () => {
    setPoints([]);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      plotNo: "",
      status: "available",
      facing: "",
      area: "",
      price: "",
      surveyNo: "",
      notes: "",
      plotTypes: ""
    });
  };

  const handleSavePlot = async () => {
    if (!selectedVenture || !formData.plotNo || !formData.area || !formData.price) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Convert stage coordinates to original image coordinates for saving
      const coords = [];
      for (let i = 0; i < points.length; i += 2) {
        const [imageX, imageY] = stageToImageCoords(points[i], points[i + 1]);
        coords.push([imageX, imageY]);
      }
      coords.push(coords[0]); // Close polygon

      const plotData = {
        ...formData,
        ventureId: selectedVenture._id,
        area: parseFloat(formData.area),
        price: parseFloat(formData.price),
        geometry: { type: "Polygon", coordinates: [coords] }
      };

      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/plot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(plotData),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        // Store rawPoints in original image coordinates (flatten coords array, excluding the closing point)
        const rawPoints = coords.slice(0, -1).flat();
        setPolygons([...polygons, {
          id: result.data._id,
          plotNo: formData.plotNo,
          status: formData.status,
          rawPoints: rawPoints
        }]);
        setSuccess(`Plot ${formData.plotNo} saved successfully!`);
        setTimeout(() => setSuccess(""), 4000);
        handleClearDrawing();
      } else {
        setError(result.message || "Failed to save plot");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#22c55e',
      sold: '#ef4444',
      booked: '#f59e0b',
      reserved: '#8b5cf6',
      hold: '#fbbf24',
      tentatively_booked: '#ec4899',
      cip: '#06b6d4'
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const statusOptions = [
    { value: 'available', label: 'Available', color: '#22c55e' },
    { value: 'sold', label: 'Sold', color: '#ef4444' },
    { value: 'booked', label: 'Booked', color: '#f59e0b' },
    { value: 'reserved', label: 'Reserved', color: '#8b5cf6' },
    { value: 'hold', label: 'Hold', color: '#fbbf24' },
    { value: 'tentatively_booked', label: 'Tentatively Booked', color: '#ec4899' },
    { value: 'cip', label: 'CIP', color: '#06b6d4' }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: '100vh',
      padding: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        borderRadius: '16px',
        padding: '1.25rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            ✏️ Plot Drawer
            <Badge bg="light" text="dark" style={{ fontSize: '0.6rem' }}>V2</Badge>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
            Draw plots on venture images with precision
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Form.Select
            value={selectedVenture?._id || ''}
            onChange={handleVentureChange}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              minWidth: '220px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <option value="" style={{ background: '#1e293b' }}>Select Venture...</option>
            {ventures.map(v => (
              <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>
                {v.name} {v.isDefault ? '⭐' : ''}
              </option>
            ))}
          </Form.Select>
          {venturesLoading && <Spinner animation="border" size="sm" variant="light" />}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible style={{ borderRadius: '12px' }}>
          ⚠️ {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible style={{ borderRadius: '12px' }}>
          ✅ {success}
        </Alert>
      )}

      <Row>
        {/* Canvas Area */}
        <Col lg={showForm ? 7 : 9}>
          <Card style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Toolbar */}
            <div style={{
              padding: '1rem 1.5rem',
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  onClick={handleCompletePolygon}
                  disabled={points.length < 6 || showForm}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.6rem 1.25rem',
                    fontWeight: '600'
                  }}
                >
                  ✓ Complete ({points.length / 2} pts)
                </Button>
                <Button
                  variant="outline-warning"
                  onClick={handleUndoPoint}
                  disabled={points.length < 2}
                  style={{ borderRadius: '10px' }}
                >
                  ↩ Undo
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={handleClearDrawing}
                  disabled={points.length === 0}
                  style={{ borderRadius: '10px' }}
                >
                  ✕ Clear
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge bg="primary" style={{ padding: '0.5rem 1rem', borderRadius: '20px' }}>
                  📊 {polygons.length} plots
                </Badge>
              </div>
            </div>

            {/* Canvas */}
            <div style={{ padding: '0' }}>
              {!selectedVenture ? (
                <div style={{
                  height: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏘️</div>
                  <h4 style={{ color: '#fff' }}>Select a Venture</h4>
                  <p>Choose a venture from the dropdown above to start drawing</p>
                </div>
              ) : imageLoading ? (
                <div style={{
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div style={{ overflow: 'auto', maxHeight: '70vh' }}>
                  <Stage
                    width={stageSize.width}
                    height={stageSize.height}
                    onClick={handleCanvasClick}
                    style={{ cursor: showForm ? 'default' : 'crosshair', display: 'block' }}
                  >
                    <Layer>
                      {image && <KonvaImage image={image} width={stageSize.width} height={stageSize.height} />}

                      {/* Existing Polygons */}
                      {polygons.map((poly) => {
                        // Convert raw points from original image coords to stage coords
                        const stagePoints = convertRawPointsToStage(poly.rawPoints);
                        if (stagePoints.length === 0) return null;
                        return (
                          <Group key={poly.id}>
                            <Line
                              points={stagePoints}
                              closed
                              stroke={getStatusColor(poly.status)}
                              strokeWidth={2}
                              fill={`${getStatusColor(poly.status)}40`}
                            />
                            <Text
                              x={stagePoints[0] || 0}
                              y={(stagePoints[1] || 0) - 18}
                              text={`#${poly.plotNo}`}
                              fontSize={11}
                              fill="#fff"
                              fontStyle="bold"
                            />
                          </Group>
                        );
                      })}

                      {/* Current Drawing */}
                      {points.length > 0 && (
                        <>
                          <Line points={points} stroke="#3b82f6" strokeWidth={3} dash={[8, 4]} />
                          {Array.from({ length: points.length / 2 }).map((_, i) => (
                            <Circle
                              key={i}
                              x={points[i * 2]}
                              y={points[i * 2 + 1]}
                              radius={6}
                              fill="#3b82f6"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </>
                      )}
                    </Layer>
                  </Stage>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Form Panel - Only show when completing polygon */}
        {showForm ? (
          <Col lg={5}>
            <Card style={{
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              color: '#fff',
              backdropFilter: 'blur(20px)'
            }}>
              <Card.Header style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '16px 16px 0 0',
                padding: '1.25rem'
              }}>
                <h5 style={{ margin: 0, fontWeight: '600' }}>📝 Plot Details</h5>
              </Card.Header>
              <Card.Body style={{ padding: '1.5rem' }}>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Plot Number *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., A-101"
                        value={formData.plotNo}
                        onChange={(e) => setFormData({ ...formData, plotNo: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '10px'
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Status</Form.Label>
                      <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '10px'
                        }}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>
                            {opt.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Area (sq.yd) *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="200"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '10px'
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Price (₹) *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="2500000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '10px'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Facing</Form.Label>
                      <Form.Select
                        value={formData.facing}
                        onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '10px'
                        }}
                      >
                        <option value="" style={{ background: '#1e293b' }}>Select...</option>
                        {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(f => (
                          <option key={f} value={f} style={{ background: '#1e293b' }}>{f}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Plot Type</Form.Label>
                      <Form.Select
                        value={formData.plotTypes}
                        onChange={(e) => setFormData({ ...formData, plotTypes: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '10px'
                        }}
                      >
                        <option value="" style={{ background: '#1e293b' }}>Select...</option>
                        <option value="Residential" style={{ background: '#1e293b' }}>Residential</option>
                        <option value="Commercial" style={{ background: '#1e293b' }}>Commercial</option>
                        <option value="Corner" style={{ background: '#1e293b' }}>Corner</option>
                        <option value="Park Facing" style={{ background: '#1e293b' }}>Park Facing</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Survey Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Survey/Plot reference"
                    value={formData.surveyNo}
                    onChange={(e) => setFormData({ ...formData, surveyNo: e.target.value })}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      borderRadius: '10px'
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '500', fontSize: '0.85rem' }}>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      borderRadius: '10px'
                    }}
                  />
                </Form.Group>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button
                    variant="secondary"
                    onClick={handleClearDrawing}
                    style={{ flex: 1, borderRadius: '10px', padding: '0.75rem' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePlot}
                    disabled={loading || !formData.plotNo || !formData.area || !formData.price}
                    style={{
                      flex: 2,
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : '💾 Save Plot'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Status Legend */}
            <Card style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
              marginTop: '1rem'
            }}>
              <Card.Body style={{ padding: '1rem' }}>
                <h6 style={{ marginBottom: '0.75rem', fontWeight: '600' }}>📊 Status Legend</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {statusOptions.map(opt => (
                    <Badge
                      key={opt.value}
                      style={{
                        background: opt.color,
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontWeight: '500'
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          /* Instructions Panel when not drawing */
          <Col lg={3}>
            <Card style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              color: '#fff'
            }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <h5 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>📖 How to Draw</h5>

                <div style={{ marginBottom: '1.5rem' }}>
                  {[
                    { step: '1', text: 'Select a venture', icon: '🏘️' },
                    { step: '2', text: 'Click on image to add vertices', icon: '👆' },
                    { step: '3', text: 'Add at least 3 points', icon: '📍' },
                    { step: '4', text: 'Click "Complete" to finish', icon: '✓' },
                    { step: '5', text: 'Fill in plot details', icon: '📝' }
                  ].map(({ step, text, icon }) => (
                    <div key={step} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem'
                      }}>
                        {icon}
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  padding: '1rem'
                }}>
                  <h6 style={{ marginBottom: '0.75rem', fontWeight: '600' }}>📊 Status Colors</h6>
                  {statusOptions.slice(0, 5).map(opt => (
                    <div key={opt.value} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.4rem'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: opt.color
                      }} />
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default PlotDrawer;