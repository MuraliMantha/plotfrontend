import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Modal, Button, Form, Container } from 'react-bootstrap';
import siteplan from '../../assets/siteplan.png';

const PlotViewer = () => {
  const canvasRef = useRef(null);
  const [plots, setPlots] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPlotDialog, setShowPlotDialog] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [statusMsg, setStatusMsg] = useState('');
  const [filters, setFilters] = useState({
    plotNos: '',
    status: 'all',
    facing: '',
    plotTypes: '',
    minArea: '',
    maxArea: '',
  });
  const [lastLoadedGeoJSON, setLastLoadedGeoJSON] = useState(null);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const imageRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const plotNumberDivsRef = useRef([]);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const minZoom = 0.4;
  const maxZoom = 2.5;

  // Helper: Clamp value
  const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

  // Helper: Get color by status
  const getColorByStatus = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'sold': return '#e74c3c';
      case 'booked': return '#9b59b6';
      case 'tentatively_booked': return '#bb53a5';
      case 'available': return '#27ae60';
      case 'reserved': return '#f39c12';
      case 'hold': return '#FFC85C';
      case 'cip': return '#d2b27e';
      default: return '#bdc3c7';
    }
  };

  // Helper: Calculate polygon centroid
  const polygonCentroid = (coords) => {
    let area = 0, x = 0, y = 0;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const f = coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1];
      area += f;
      x += (coords[i][0] + coords[j][0]) * f;
      y += (coords[i][1] + coords[j][1]) * f;
    }
    area *= 3;
    return area === 0 ? [0, 0] : [x / area, y / area]; // Prevent division by zero
  };

  // 1. Setup Scene, Camera, Renderer, and Background
  useEffect(() => {
    const img = new window.Image();
    img.src = siteplan;
    imageRef.current = img;

    img.onload = () => {
      const width = img.width;
      const height = img.height;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.OrthographicCamera(0, width, height, 0, -100, 100);
      camera.position.z = 10;
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(width, height);
      rendererRef.current = renderer;

      // Siteplan texture
      const texture = new THREE.TextureLoader().load(siteplan);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(width, height);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(width / 2, height / 2, -1);
      scene.add(plane);

      // Initial render
      renderer.render(scene, camera);

      // Fetch plots
      fetchPlots();

      // Animation loop
      const animate = () => {
        renderer.render(scene, camera);
        updatePlotNumbers();
        requestAnimationFrame(animate);
      };
      animate();
    };

    // Event listeners for interactions
    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      canvasRef.current.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvasRef.current.style.cursor = 'default';
    };

    const handleMouseMove = (e) => {
      const img = imageRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current; // Fix: Use sceneRef.current
      if (!img || !camera || !scene) return;

      // Panning
      if (isDraggingRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        camera.position.x -= dx;
        camera.position.y += dy;
        updatePlotNumbers();
      }

      // Hover overlay
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) + camera.position.x;
      const my = (e.clientY - rect.top) - camera.position.y;
      mouseRef.current.x = (mx / img.width) * 2 - 1;
      mouseRef.current.y = -((my) / img.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children.filter(c => c.userData.isPlot));
      const overlay = document.getElementById('plot-overlay');
      if (intersects.length > 0 && intersects[0].object.visible) {
        canvasRef.current.style.cursor = 'pointer';
        const plot = intersects[0].object.userData;
        // Ensure plot has expected properties
        overlay.innerHTML = `
          <b>Plot No:</b> ${plot.plotNo || 'N/A'}<br>
          <b>Area:</b> ${plot.area ? plot.area + ' sq.yd' : 'N/A'}<br>
          <b>Status:</b> ${plot.status || 'N/A'}<br>
          <b>Price:</b> ${plot.price ? '₹' + plot.price.toLocaleString() : 'N/A'}
        `;
        overlay.style.display = 'block';
        overlay.style.left = `${e.clientX + 10}px`;
        overlay.style.top = `${e.clientY + 10}px`;
      } else {
        canvasRef.current.style.cursor = 'default';
        overlay.style.display = 'none';
      }
    };

    const handleClick = (e) => {
      if (isDraggingRef.current) return;
      const img = imageRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current; // Fix: Use sceneRef.current
      if (!img || !camera || !scene) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) + camera.position.x;
      const my = (e.clientY - rect.top) - camera.position.y;
      mouseRef.current.x = (mx / img.width) * 2 - 1;
      mouseRef.current.y = -((my) / img.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children.filter(c => c.userData.isPlot));
      if (intersects.length > 0 && intersects[0].object.visible) {
        setSelectedPlot(intersects[0].object.userData);
        setShowPlotDialog(true);
      }
    };

    const handleMouseLeave = () => {
      document.getElementById('plot-overlay').style.display = 'none';
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomIn = e.deltaY < 0;
      zoomRef.current = clamp(zoomRef.current * (zoomIn ? 1.13 : 1 / 1.13), minZoom, maxZoom);
      updateZoomCamera();
    };

    canvasRef.current?.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvasRef.current?.addEventListener('mousemove', handleMouseMove);
    canvasRef.current?.addEventListener('click', handleClick);
    canvasRef.current?.addEventListener('mouseleave', handleMouseLeave);
    canvasRef.current?.addEventListener('wheel', handleWheel);

    // Cleanup
    return () => {
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current?.removeEventListener('click', handleClick);
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave);
      canvasRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 2. Fetch Plots and Poll for Updates
  const fetchPlots = () => {
    fetch('http://localhost:5000/api/plot', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        console.log('Fetched plots:', data.features); // Debug: Log fetched data
        setPlots(data.features);
        setLastLoadedGeoJSON(data);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setStatusMsg('Unauthorized or Error loading plots!');
      });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5000/api/plot', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then((data) => {
          if (JSON.stringify(data) !== JSON.stringify(lastLoadedGeoJSON)) {
            console.log('GeoJSON updated:', data.features); // Debug: Log updates
            setPlots(data.features);
            setLastLoadedGeoJSON(data);
          }
        })
        .catch((err) => {
          console.error('Polling error:', err);
          setStatusMsg('Error polling plots!');
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [lastLoadedGeoJSON]);

  // 3. Update Plot Meshes and Labels
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer || !imageRef.current) return;

    // Remove previous plot meshes and labels
    scene.children
      .filter((child) => child.userData && child.userData.isPlot)
      .forEach((mesh) => scene.remove(mesh));
    plotNumberDivsRef.current.forEach((div) => div.remove());
    plotNumberDivsRef.current = [];

    // Add new plot meshes and labels
    plots.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      const shape = new THREE.Shape();
      coords.forEach(([x, y], idx) => {
        const yFlipped = imageRef.current.height - y; // Flip Y for Three.js
        if (idx === 0) shape.moveTo(x, yFlipped);
        else shape.lineTo(x, yFlipped);
      });
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
      const material = new THREE.MeshBasicMaterial({
        color: getColorByStatus(feature.properties.status),
        opacity: 0.55,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { ...feature.properties, isPlot: true }; // Ensure userData is set
      console.log('Mesh userData:', mesh.userData); // Debug: Log userData
      scene.add(mesh);

      // Add plot number label
      const centroid = polygonCentroid(coords);
      const div = document.createElement('div');
      div.className = 'plot-number';
      div.innerText = feature.properties.plotNo;
      div.dataset.centroidX = centroid[0];
      div.dataset.centroidY =  centroid[1]; // Flip Y
      document.body.appendChild(div);
      plotNumberDivsRef.current.push(div);
    });

    updatePlotNumbers();
    renderer.render(scene, camera);
  }, [plots]);

  // 4. Update Plot Number Positions
  const updatePlotNumbers = () => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const canvasRect = canvas.getBoundingClientRect();
    const camOffsetX = camera.position.x;
    const camOffsetY = camera.position.y;
    plotNumberDivsRef.current.forEach((div) => {
      const x = +div.dataset.centroidX - camOffsetX;
      const y = +div.dataset.centroidY + camOffsetY;
      div.style.left = `${canvasRect.left + x}px`;
      div.style.top = `${canvasRect.top + y}px`;
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -50%)';
    });
  };

  // 5. Zoom Handling
  const handleZoom = (zoomIn) => {
    zoomRef.current = clamp(zoomRef.current * (zoomIn ? 1.13 : 1 / 1.13), minZoom, maxZoom);
    updateZoomCamera();
  };

  const updateZoomCamera = () => {
    const img = imageRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!img || !camera || !renderer) return;

    const width = img.width;
    const height = img.height;
    camera.left = 0 - (width * (zoomRef.current - 1) / 2) + camera.position.x;
    camera.right = width + (width * (zoomRef.current - 1) / 2) + camera.position.x;
    camera.top = 0 - (height * (zoomRef.current - 1) / 2) + camera.position.y;
    camera.bottom = height + (height * (zoomRef.current - 1) / 2) + camera.position.y;
    camera.updateProjectionMatrix();
    renderer.render(sceneRef.current, camera);
    updatePlotNumbers();
  };

  const handleReset = () => {
    const img = imageRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!img || !camera || !renderer) return;

    zoomRef.current = 1;
    camera.position.set(0, 0, 10);
    camera.left = 0;
    camera.right = img.width;
    camera.top = img.height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
    renderer.render(sceneRef.current, camera);
    updatePlotNumbers();
  };

  // 6. Filter Plots
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/plot', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        const plotNos = filters.plotNos
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        let filtered = data.features.filter((p) => {
          const props = p.properties;
          return (
            (!plotNos.length || plotNos.includes(String(props.plotNo))) &&
            (filters.status === 'all' || props.status.toLowerCase() === filters.status.toLowerCase()) &&
            (!filters.facing || props.facing.toLowerCase().includes(filters.facing.toLowerCase())) &&
            (!filters.plotTypes || props.plotTypes.toLowerCase().includes(filters.plotTypes.toLowerCase())) &&
            (!filters.minArea || props.area >= parseFloat(filters.minArea)) &&
            (!filters.maxArea || props.area <= parseFloat(filters.maxArea))
          );
        });
        setPlots(filtered);
        setShowFilterModal(false);
      })
      .catch((err) => {
        console.error('Filter error:', err);
        setStatusMsg('Error filtering plots!');
      });
  };

  // 7. Status Bar
  const renderStatusBar = () => {
    const counts = {
      total: plots.length,
      available: 0,
      hold: 0,
      sold: 0,
      tentatively_booked: 0,
      cip: 0,
      booked: 0,
      reserved: 0,
    };
    plots.forEach((p) => {
      const status = (p.properties.status || '').toLowerCase();
      if (status === 'available') counts.available++;
      else if (status === 'hold') counts.hold++;
      else if (status === 'sold') counts.sold++;
      else if (status === 'tentatively_booked') counts.tentatively_booked++;
      else if (status === 'cip') counts.cip++;
      else if (status === 'booked') counts.booked++;
      else if (status === 'reserved') counts.reserved++;
    });
    return (
      <div className="status-bar">
        <span className="status-badge status-total">🗺️ Total: {counts.total}</span>
        <span className="status-badge status-available">✔️ Available: {counts.available}</span>
        <span className="status-badge status-hold">⏸️ Hold: {counts.hold}</span>
        <span className="status-badge status-sold">❌ Sold: {counts.sold}</span>
        <span className="status-badge status-tentative">❎ Tentatively Booked: {counts.tentatively_booked}</span>
        <span className="status-badge status-cip">✖️ CIP: {counts.cip}</span>
        <span className="status-badge status-booked">📜 Booked: {counts.booked}</span>
        <span className="status-badge status-reserved">🔒 Reserved: {counts.reserved}</span>
      </div>
    );
  };

  // 8. Enquiry Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, plotNo: selectedPlot.plotNo }),
      });
      if (res.ok) {
        setStatusMsg('Enquiry submitted successfully!');
        setFormData({ name: '', phone: '', email: '', message: '' });
        setShowBookingModal(false);
        setShowPlotDialog(false);
      } else {
        setStatusMsg('Error submitting enquiry!');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setStatusMsg('Error submitting enquiry!');
    }
  };

  return (
    <Container fluid style={{ height: '100vh', background: '#1f2937', padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Status Message */}
      <div style={{ color: '#16a34a', fontWeight: '500', padding: '8px', textAlign: 'center' }}>{statusMsg}</div>
      {/* Status Bar */}
      <div style={{ padding: '8px', background: '#fff', textAlign: 'center' }}>{renderStatusBar()}</div>
      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0, minWidth: 0 }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
      {/* Hover Overlay */}
      <div id="plot-overlay" style={{ position: 'absolute', display: 'none', background: '#fff', padding: '8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 1000 }} />
      {/* Toolbar */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px' }}>
        <Button variant="light" onClick={() => handleZoom(true)} style={{ padding: '8px 16px', fontSize: '1.25rem', borderRadius: '6px' }}>+</Button>
        <Button variant="light" onClick={() => handleZoom(false)} style={{ padding: '8px 16px', fontSize: '1.25rem', borderRadius: '6px' }}>−</Button>
        <Button variant="light" onClick={() => setShowFilterModal(true)} style={{ padding: '8px 16px', fontSize: '1rem', borderRadius: '6px' }}>▼ Filter</Button>
        <Button variant="light" onClick={handleReset} style={{ padding: '8px 16px', fontSize: '1rem', borderRadius: '6px' }}>⟳ Reset</Button>
      </div>
      {/* Filter Modal */}
      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Filter Plots</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFilterSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Plot Numbers (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                value={filters.plotNos}
                onChange={(e) => setFilters({ ...filters, plotNos: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
                <option value="hold">Hold</option>
                <option value="tentatively_booked">Tentatively Booked</option>
                <option value="cip">CIP</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Facing</Form.Label>
              <Form.Control
                type="text"
                value={filters.facing}
                onChange={(e) => setFilters({ ...filters, facing: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Plot Type</Form.Label>
              <Form.Control
                type="text"
                value={filters.plotTypes}
                onChange={(e) => setFilters({ ...filters, plotTypes: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Min Area (sq.yd)</Form.Label>
              <Form.Control
                type="number"
                value={filters.minArea}
                onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max Area (sq.yd)</Form.Label>
              <Form.Control
                type="number"
                value={filters.maxArea}
                onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
              />
            </Form.Group>
            <Button variant="primary" type="submit" style={{ background: 'linear-gradient(to right, #4f46e5, #3b82f6)', border: 'none' }}>
              Apply Filters
            </Button>
            <Button
              variant="secondary"
              onClick={() => setFilters({ plotNos: '', status: 'all', facing: '', plotTypes: '', minArea: '', maxArea: '' })}
              style={{ marginLeft: '8px' }}
            >
              Reset Filters
            </Button>
        </Form>
      </Modal.Body>
      </Modal>
      {/* Plot Dialog */}
      <Modal show={showPlotDialog} onHide={() => setShowPlotDialog(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Plot {selectedPlot?.plotNo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlot && (
            <div>
              <div><b>Status:</b> {selectedPlot.status || 'N/A'}</div>
              <div><b>Facing:</b> {selectedPlot.facing || 'N/A'}</div>
              <div><b>Measurements:</b> {selectedPlot.measurements || 'N/A'}</div>
              <div><b>Area:</b> {selectedPlot.area ? `${selectedPlot.area} sq.yd` : 'N/A'}</div>
              <div><b>Boundaries:</b> {selectedPlot.boundaries || 'N/A'}</div>
              <div><b>Notes:</b> {selectedPlot.notes || 'N/A'}</div>
              <div><b>Plot Type(s):</b> {selectedPlot.plotTypes || 'N/A'}</div>
              <div><b>Pricing:</b> {selectedPlot.price ? `₹${selectedPlot.price.toLocaleString()}` : 'N/A'}</div>
              <div><b>Survey No:</b> {selectedPlot.surveyNo || 'N/A'}</div>
              <div><b>Location Pin:</b> {selectedPlot.locationPin || 'N/A'}</div>
              <div><b>Address:</b> {selectedPlot.address || 'N/A'}</div>
              {selectedPlot.status.toLowerCase() === 'available' && (
                <Button
                  variant="success"
                  onClick={() => {
                    setShowBookingModal(true);
                    setShowPlotDialog(false);
                  }}
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  Book This Plot
                </Button>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Book Plot {selectedPlot?.plotNo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBookingSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </Form.Group>
            <Button variant="primary" type="submit" style={{ background: 'linear-gradient(to right, #4f46e5, #3b82f6)', border: 'none' }}>
              Submit Enquiry
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PlotViewer;
