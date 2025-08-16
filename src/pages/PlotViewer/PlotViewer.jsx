import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Modal, Button, Form, Container } from 'react-bootstrap';
import siteplan from '../../assets/siteplan.png';

const PlotViewer = () => {
  // REFS
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const plotLabelContainerRef = useRef(null);

  // STATE
 const [plots, setPlots] = useState([])
  
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

  // Internals
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

  // For overlay
  const [hoverData, setHoverData] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const [imageWidth, setImageWidth] = useState(null);
  const [imageHeight, setImageHeight] = useState(null);

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
    return area === 0 ? [0, 0] : [x / area, y / area];
  };

  // 1. Setup Scene, Camera, Renderer, and Background
  useEffect(() => {
    const img = new window.Image();
    img.src = siteplan;
    imageRef.current = img;

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      setImageWidth(width);
      setImageHeight(height);

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera: Centered on image
      const camera = new THREE.OrthographicCamera(
        0, width, height, 0, -100, 100
      );
      camera.position.set(0, 0, 10);
      cameraRef.current = camera;
      zoomRef.current = 1;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(width, height);
      rendererRef.current = renderer;

      // Image plane
      const texture = new THREE.TextureLoader().load(siteplan);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(width, height);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(width / 2, height / 2, -1);
      scene.add(plane);

      fetchPlots();

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
      const scene = sceneRef.current;
      if (!img || !camera || !scene) return;

      // Panning
if (isDraggingRef.current) {
  const dx = e.clientX - lastMouseRef.current.x;
  const dy = e.clientY - lastMouseRef.current.y;
  lastMouseRef.current = { x: e.clientX, y: e.clientY };

  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const zoom = zoomRef.current;
  const img = imageRef.current;

  // Convert dx/dy in pixels to world units
  const worldDX = (dx / rect.width) * (camera.right - camera.left);
  const worldDY = (dy / rect.height) * (camera.top - camera.bottom);

  camera.left -= worldDX;
camera.right -= worldDX;
camera.top += worldDY;
camera.bottom += worldDY;

  camera.updateProjectionMatrix();
  updatePlotNumbers();
  return;
}


      // Hover overlay
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left);
      const my = (e.clientY - rect.top);

      // Convert to world coordinates
      const worldX = camera.left + (mx / rect.width) * (camera.right - camera.left);
      const worldY = camera.top - (my / rect.height) * (camera.top - camera.bottom);

      mouseRef.current.x = (mx / rect.width) * 2 - 1;
      mouseRef.current.y = -((my / rect.height) * 2 - 1);

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children.filter(c => c.userData && c.userData.isPlot));
      if (intersects.length > 0 && intersects[0].object.visible) {
        setHoverData(intersects[0].object.userData);
        setHoverPos({ x: e.clientX, y: e.clientY });
        canvasRef.current.style.cursor = 'pointer';
      } else {
        setHoverData(null);
        canvasRef.current.style.cursor = 'default';
      }
    };

    const handleClick = (e) => {
      if (isDraggingRef.current) return;
      const img = imageRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!img || !camera || !scene) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left);
      const my = (e.clientY - rect.top);

      // Convert to NDC
      mouseRef.current.x = (mx / rect.width) * 2 - 1;
      mouseRef.current.y = -((my / rect.height) * 2 - 1);
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children.filter(c => c.userData && c.userData.isPlot));
      if (intersects.length > 0 && intersects[0].object.visible) {
        setSelectedPlot(intersects[0].object.userData);
        setShowPlotDialog(true);
      }
    };

    const handleWheel = (e) => {
  e.preventDefault();
  const camera = cameraRef.current;
  const rect = canvasRef.current.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoomIn = e.deltaY < 0;
  const prevZoom = zoomRef.current;
  const newZoom = clamp(prevZoom * (zoomIn ? 1.1 : 1 / 1.1), minZoom, maxZoom);
  if (newZoom === prevZoom) return;
  zoomRef.current = newZoom;

  // Mouse position in normalized device coordinates
  const ndcX = (mouseX / rect.width) * 2 - 1;
  const ndcY = -((mouseY / rect.height) * 2 - 1);

  // World position before zoom
  const worldBefore = new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);

  // Update camera size
  const width = imageRef.current.width / newZoom;
  const height = imageRef.current.height / newZoom;
  const cx = (camera.left + camera.right) / 2;
  const cy = (camera.top + camera.bottom) / 2;
  camera.left = cx - width / 2;
  camera.right = cx + width / 2;
  camera.top = cy + height / 2;
  camera.bottom = cy - height / 2;
  camera.updateProjectionMatrix();

  // World position after zoom
  const worldAfter = new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);
  const delta = worldBefore.sub(worldAfter);

  // Apply correction to keep mouse anchor point stable
  camera.left += delta.x;
  camera.right += delta.x;
  camera.top += delta.y;
  camera.bottom += delta.y;
  camera.updateProjectionMatrix();

  updatePlotNumbers();
};


    canvasRef.current?.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvasRef.current?.addEventListener('mousemove', handleMouseMove);
    canvasRef.current?.addEventListener('click', handleClick);
    canvasRef.current?.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current?.removeEventListener('click', handleClick);
      canvasRef.current?.removeEventListener('wheel', handleWheel);
    };
    // eslint-disable-next-line
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
        setPlots(data.features);
        setLastLoadedGeoJSON(data);
      })
      .catch((err) => {
        setStatusMsg('Unauthorized or Error loading plots!');
      });
  };

  // Poll for updates every 5s
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
            setPlots(data.features);
            setLastLoadedGeoJSON(data);
          }
        })
        .catch((err) => {
          setStatusMsg('Error polling plots!');
        });
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
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
    plotLabelContainerRef.current && (plotLabelContainerRef.current.innerHTML = '');
    plotNumberDivsRef.current = [];

    // Add new plot meshes and labels
    plots.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      const shape = new THREE.Shape();
      coords.forEach(([x, y], idx) => {
        const yFlipped = imageRef.current.height - y;
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
      mesh.userData = { ...feature.properties, isPlot: true };
      scene.add(mesh);

      // Plot number label
      const centroid = polygonCentroid(coords);
      const div = document.createElement('div');
      div.className = 'plot-number';
      div.innerText = feature.properties.plotNo;
      div.dataset.worldX = centroid[0];
      div.dataset.worldY = imageRef.current.height - centroid[1];
      div.style.position = 'absolute';
      div.style.pointerEvents = 'none';
      div.style.color = '#000';
      div.style.background = 'rgba(255,255,255,0.82)';
      div.style.padding = '4px 8px';
      div.style.borderRadius = '4px';
      div.style.fontSize = '12px';
      div.style.fontWeight = 'bold';
      div.style.userSelect = 'none';
      plotLabelContainerRef.current && plotLabelContainerRef.current.appendChild(div);
      plotNumberDivsRef.current.push(div);
    });

    updatePlotNumbers();
    renderer.render(scene, camera);
    // eslint-disable-next-line
  }, [plots, imageWidth, imageHeight]);

  // 4. Update Plot Number Positions
  const updatePlotNumbers = () => {
  const camera = cameraRef.current;
  const canvas = canvasRef.current;
  const wrapper = canvasWrapperRef.current;
  if (!camera || !canvas || !wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  plotNumberDivsRef.current.forEach(div => {
    const wx = parseFloat(div.dataset.worldX);
    const wy = parseFloat(div.dataset.worldY);

    const vector = new THREE.Vector3(wx, wy, 0).project(camera);
    const screenX = (vector.x * 0.5 + 0.5) * w;
    const screenY = (1 - (vector.y * 0.5 + 0.5)) * h;

    if (screenX < 0 || screenY < 0 || screenX > w || screenY > h) {
      div.style.display = 'none';
    } else {
      div.style.display = 'block';
      div.style.left = `${screenX}px`;
      div.style.top = `${screenY}px`;
      div.style.transform = 'translate(-50%, -50%)';
    }
  });
};



  // 5. Zoom Handling for Toolbar
  const handleZoom = (zoomIn) => {
    const camera = cameraRef.current;
    const centerX = (camera.left + camera.right) / 2;
    const centerY = (camera.top + camera.bottom) / 2;
    const prevZoom = zoomRef.current;
    const newZoom = clamp(prevZoom * (zoomIn ? 1.13 : 1 / 1.13), minZoom, maxZoom);
    if (newZoom === prevZoom) return;
    zoomRef.current = newZoom;
    const width = imageRef.current.width / newZoom;
    const height = imageRef.current.height / newZoom;
    camera.left = centerX - width / 2;
    camera.right = centerX + width / 2;
    camera.top = centerY + height / 2;
    camera.bottom = centerY - height / 2;
    camera.updateProjectionMatrix();
    updatePlotNumbers();
  };

  // 6. Reset Handler
  const handleReset = () => {
    const img = imageRef.current;
    const camera = cameraRef.current;
    if (!img || !camera) return;
    zoomRef.current = 1;
    camera.left = 0;
    camera.right = img.width;
    camera.top = img.height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
    updatePlotNumbers();
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

  // 8. Filter Plots
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
        setStatusMsg('Error filtering plots!');
      });
  };

  // 9. Booking Submit
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
      setStatusMsg('Error submitting enquiry!');
    }
  };

  // ---- RENDER ----
  return (
    <Container fluid style={{ height: '100vh', background: '#1f2937', padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Status Message */}
      <div style={{ color: '#16a34a', fontWeight: '500', padding: '8px', textAlign: 'center' }}>{statusMsg}</div>
      {/* Status Bar */}
      <div style={{ padding: '8px', background: '#fff', textAlign: 'center' }}>{renderStatusBar()}</div>
      {/* Canvas + Labels */}
      <div
        ref={canvasWrapperRef}
  style={{
    position: 'relative',
    width: imageWidth ? `${imageWidth}px` : '100%',
    height: imageHeight ? `${imageHeight}px` : '100%',
    margin: '0 auto',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1f2937',
    overflow: 'hidden' // ✅ Prevent overflow
  }}
>
  <canvas ref={canvasRef} style={{ display: 'block' }} />
  <div
    ref={plotLabelContainerRef}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 11
    }}
  />
        {/* Hover Overlay */}
        {hoverData && (
          <div
            style={{
              position: 'fixed',
              left: hoverPos.x + 16,
              top: hoverPos.y + 16,
              background: '#fff',
              padding: '10px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 1001,
              pointerEvents: 'none'
            }}
          >
            <b>Plot No:</b> {hoverData.plotNo || 'N/A'}<br />
            <b>Area:</b> {hoverData.area ? hoverData.area + ' sq.yd' : 'N/A'}<br />
            <b>Status:</b> {hoverData.status || 'N/A'}<br />
            <b>Price:</b> {hoverData.price ? '₹' + hoverData.price.toLocaleString() : 'N/A'}
          </div>
        )}
      </div>
      {/* Toolbar */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 2000 }}>
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
    <Modal 
  show={showPlotDialog} 
  onHide={() => setShowPlotDialog(false)} 
  centered 
  size="lg"
  style={{ 
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}
>
  <Modal.Header 
    closeButton 
    style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem 0.375rem 0 0',
      padding: '1.5rem'
    }}
  >
    <Modal.Title 
      style={{ 
        fontSize: '1.5rem', 
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}
    >
      📍 Plot {selectedPlot?.plotNo}
      {selectedPlot?.status && (
        <span 
          style={{ 
            backgroundColor: selectedPlot.status?.toLowerCase() === 'available' ? '#28a745' : 
                           selectedPlot.status?.toLowerCase() === 'booked' ? '#ffc107' : 
                           selectedPlot.status?.toLowerCase() === 'sold' ? '#dc3545' : '#6c757d',
            color: 'white',
            padding: '0.375rem 0.75rem',
            borderRadius: '1.25rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}
        >
          {selectedPlot.status}
        </span>
      )}
    </Modal.Title>
  </Modal.Header>
  
  <Modal.Body 
    style={{ 
      padding: '0', 
      background: '#f8f9fa',
      maxHeight: '70vh',
      overflowY: 'auto'
    }}
  >
    {selectedPlot && (
      <div style={{ padding: '1.5rem' }}>
        
        {/* Price Highlight Card */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 0.5rem 2rem rgba(17, 153, 142, 0.3)'
          }}
        >
          <h3 
            style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '2.2rem', 
              fontWeight: '700' 
            }}
          >
            {selectedPlot.price ? 
              (selectedPlot.price >= 10000000 ? 
                `₹${(selectedPlot.price / 10000000).toFixed(2)} Cr` : 
                selectedPlot.price >= 100000 ? 
                `₹${(selectedPlot.price / 100000).toFixed(2)} L` : 
                `₹${selectedPlot.price.toLocaleString()}`
              ) : 'Price on Request'
            }
          </h3>
          <p 
            style={{ 
              margin: '0', 
              fontSize: '1.1rem', 
              opacity: '0.9' 
            }}
          >
            {selectedPlot.area ? `${selectedPlot.area} sq.yd` : 'Area details available'}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="row" style={{ marginBottom: '1.5rem' }}>
          
          {/* Property Details Column */}
          <div className="col-md-6" style={{ marginBottom: '1.25rem' }}>
            <div 
              style={{ 
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 0.25rem 1.25rem rgba(0,0,0,0.08)',
                height: '100%',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1rem 1.25rem',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}
              >
                🏗️ Property Details
              </div>
              <div style={{ padding: '1.25rem' }}>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div 
                    style={{ 
                      color: '#495057', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}
                  >
                    FACING:
                  </div>
                  <div 
                    style={{ 
                      fontSize: '1.05rem', 
                      color: '#212529',
                      fontWeight: '500'
                    }}
                  >
                    🧭 {selectedPlot.facing || 'N/A'}
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div 
                    style={{ 
                      color: '#495057', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}
                  >
                    MEASUREMENTS:
                  </div>
                  <div 
                    style={{ 
                      fontSize: '1.05rem', 
                      color: '#212529',
                      fontWeight: '500'
                    }}
                  >
                    📐 {selectedPlot.measurements || 'N/A'}
                  </div>
                </div>
                
                <div style={{ marginBottom: '0' }}>
                  <div 
                    style={{ 
                      color: '#495057', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem'
                    }}
                  >
                    PLOT TYPE(S):
                  </div>
                  <div>
                    {selectedPlot.plotTypes ? 
                      selectedPlot.plotTypes.split(',').map((type, index) => (
                        <span 
                          key={index}
                          style={{ 
                            backgroundColor: '#667eea',
                            color: 'white',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '1.25rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            marginRight: '0.5rem',
                            marginBottom: '0.25rem',
                            display: 'inline-block'
                          }}
                        >
                          {type.trim()}
                        </span>
                      )) : <span style={{ color: '#6c757d' }}>N/A</span>
                    }
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          {/* Location Details Column */}
          <div className="col-md-6" style={{ marginBottom: '1.25rem' }}>
            <div 
              style={{ 
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 0.25rem 1.25rem rgba(0,0,0,0.08)',
                height: '100%',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  padding: '1rem 1.25rem',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}
              >
                📍 Location & Legal
              </div>
              <div style={{ padding: '1.25rem' }}>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div 
                    style={{ 
                      color: '#495057', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}
                  >
                    SURVEY NO:
                  </div>
                  <div 
                    style={{ 
                      fontSize: '1.05rem', 
                      color: '#212529',
                      fontWeight: '500'
                    }}
                  >
                    📋 {selectedPlot.surveyNo || 'N/A'}
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div 
                    style={{ 
                      color: '#495057', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}
                  >
                    LOCATION PIN:
                  </div>
                  <div 
                    style={{ 
                      fontSize: '0.95rem', 
                      color: '#212529',
                      fontWeight: '500',
                      fontFamily: 'monospace'
                    }}
                  >
                    🎯 {selectedPlot.locationPin || 'N/A'}
                  </div>
                </div>
                
                <div style={{ marginBottom: '0' }}>
                  <div 
                    style={{ 
                      color: '#495057', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}
                  >
                    ADDRESS:
                  </div>
                  <div 
                    style={{ 
                      fontSize: '1rem', 
                      color: '#212529',
                      lineHeight: '1.5',
                      fontWeight: '500'
                    }}
                  >
                    🏠 {selectedPlot.address || 'N/A'}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div 
          style={{ 
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 0.25rem 1.25rem rgba(0,0,0,0.08)',
            marginBottom: '1.5rem'
          }}
        >
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '1rem 1.25rem',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}
          >
            ℹ️ Additional Information
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div className="row">
              <div className="col-md-6" style={{ marginBottom: '1rem' }}>
                <div 
                  style={{ 
                    color: '#495057', 
                    fontSize: '0.85rem', 
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem'
                  }}
                >
                  BOUNDARIES:
                </div>
                <div 
                  style={{ 
                    fontSize: '1rem', 
                    color: '#212529',
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}
                >
                  🔲 {selectedPlot.boundaries || 'N/A'}
                </div>
              </div>
              <div className="col-md-6" style={{ marginBottom: '1rem' }}>
                <div 
                  style={{ 
                    color: '#495057', 
                    fontSize: '0.85rem', 
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem'
                  }}
                >
                  NOTES:
                </div>
                <div 
                  style={{ 
                    fontSize: '1rem', 
                    color: '#212529',
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}
                >
                  📝 {selectedPlot.notes || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {selectedPlot.status?.toLowerCase() === 'available' && (
          <div style={{ textAlign: 'center' }}>
            <Button
              size="lg"
              onClick={() => {
                setShowBookingModal(true);
                setShowPlotDialog(false);
              }}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '3.125rem',
                padding: '1rem 3rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                boxShadow: '0 0.5rem 2rem rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                minWidth: '200px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0.75rem 2.5rem rgba(102, 126, 234, 0.5)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6b5a8f 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0.5rem 2rem rgba(102, 126, 234, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              }}
            >
              🎯 Book This Plot
            </Button>
          </div>
        )}
      </div>
    )}
  </Modal.Body>
</Modal>
      {/* Booking Modal */}
    <Modal 
  show={showBookingModal} 
  onHide={() => setShowBookingModal(false)} 
  centered
  size="lg"
  style={{ 
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}
>
  <Modal.Header 
    closeButton 
    style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem 0.375rem 0 0',
      padding: '1.5rem'
    }}
  >
    <Modal.Title 
      style={{ 
        fontSize: '1.5rem', 
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}
    >
      🎯 Book Plot {selectedPlot?.plotNo}
    </Modal.Title>
  </Modal.Header>
  
  <Modal.Body 
    style={{ 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '0'
    }}
  >
    <div style={{ padding: '2rem' }}>
      
      {/* Plot Summary Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
          boxShadow: '0 0.5rem 1.5rem rgba(17, 153, 142, 0.3)'
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
          Plot {selectedPlot?.plotNo} - {selectedPlot?.area ? `${selectedPlot.area} sq.yd` : 'Premium Location'}
        </h4>
        <p style={{ margin: '0', opacity: '0.9', fontSize: '1.1rem' }}>
          {selectedPlot?.price ? 
            (selectedPlot.price >= 10000000 ? 
              `₹${(selectedPlot.price / 10000000).toFixed(2)} Cr` : 
              selectedPlot.price >= 100000 ? 
              `₹${(selectedPlot.price / 100000).toFixed(2)} L` : 
              `₹${selectedPlot.price.toLocaleString()}`
            ) : 'Price on Request'
          }
        </p>
      </div>

      <Form onSubmit={handleBookingSubmit} >
        
        {/* Personal Information Section */}
        <div 
          style={{ 
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 0.25rem 1rem rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}
        >
          <h5 
            style={{ 
              color: '#495057',
              marginBottom: '1.25rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            👤 Personal Information
          </h5>
          
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label 
                  style={{ 
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '0.5rem'
                  }}
                >
                  Full Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                  style={{ 
                    borderRadius: '0.5rem',
                    border: '2px solid #e9ecef',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 0.25rem rgba(102, 126, 234, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e9ecef';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label 
                  style={{ 
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '0.5rem'
                  }}
                >
                  Phone Number
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  style={{ 
                    borderRadius: '0.5rem',
                    border: '2px solid #e9ecef',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 0.25rem rgba(102, 126, 234, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e9ecef';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </Form.Group>
            </div>
          </div>
          
          <Form.Group className="mb-0">
            <Form.Label 
              style={{ 
                fontWeight: '600',
                color: '#495057',
                marginBottom: '0.5rem'
              }}
            >
              Email Address
            </Form.Label>
            <Form.Control
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email address"
              style={{ 
                borderRadius: '0.5rem',
                border: '2px solid #e9ecef',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 0.25rem rgba(102, 126, 234, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Group>
        </div>

        {/* Message Section */}
        <div 
          style={{ 
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 0.25rem 1rem rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}
        >
          <h5 
            style={{ 
              color: '#495057',
              marginBottom: '1.25rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            💬 Additional Message
          </h5>
          
          <Form.Group className="mb-0">
            <Form.Label 
              style={{ 
                fontWeight: '600',
                color: '#495057',
                marginBottom: '0.5rem'
              }}
            >
              Your Message (Optional)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your requirements, preferred payment terms, or any questions you have..."
              style={{ 
                borderRadius: '0.5rem',
                border: '2px solid #e9ecef',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                resize: 'vertical',
                minHeight: '120px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 0.25rem rgba(102, 126, 234, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Group>
        </div>

        {/* Action Buttons */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Button 
            variant="outline-secondary"
            onClick={() => setShowBookingModal(false)}
            size="lg"
            style={{ 
              borderRadius: '3.125rem',
              padding: '0.75rem 2rem',
              fontWeight: '600',
              border: '2px solid #6c757d',
              color: '#6c757d',
              transition: 'all 0.2s ease',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6c757d';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            size="lg"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '3.125rem',
              padding: '0.75rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              boxShadow: '0 0.5rem 1.5rem rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              minWidth: '180px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0.75rem 2rem rgba(102, 126, 234, 0.5)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6b5a8f 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0.5rem 1.5rem rgba(102, 126, 234, 0.4)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }}
          >
            📧 Submit Enquiry
          </Button>
        </div>

        {/* Privacy Notice */}
        <div 
          style={{ 
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}
        >
          <small 
            style={{ 
              color: '#6c757d',
              fontSize: '0.875rem',
              lineHeight: '1.4'
            }}
          >
            🔒 Your information is secure and will only be used to contact you regarding this plot enquiry. 
            We respect your privacy and won't share your details with third parties.
          </small>
        </div>
        
      </Form>
    </div>
  </Modal.Body>
</Modal>
    </Container>
  );
};

export default PlotViewer;
