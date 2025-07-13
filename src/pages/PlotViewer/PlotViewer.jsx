import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Modal, Button, Form, Container } from 'react-bootstrap';
import siteplan from '../../assets/siteplan.png';

const PlotViewer = () => {
  const canvasRef = useRef(null);
  const [plots, setPlots] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [statusMsg, setStatusMsg] = useState('');
  const [filters, setFilters] = useState({ status: 'all', minArea: '', maxArea: '' });
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const imageRef = useRef(null);

  useEffect(() => {
    
    // Initialize Three.js
    const img = new Image();
    img.src = siteplan;
    imageRef.current = img;
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      const camera = new THREE.OrthographicCamera(0, width, height, 0, -100, 100);
      camera.position.z = 10;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
      renderer.setSize(width, height);
      rendererRef.current = renderer;

      // Load site plan as texture
      const texture = new THREE.TextureLoader().load('/siteplan.png');
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(width, height);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(width / 2, height / 2, 0);
      scene.add(plane);

      // Load plots
      fetch('http://localhost:5000/api/plot', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  }
})
  .then((res) => {
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  })
  .then((data) => {
    setPlots(data.features);
    // rest of your logic...
  })
  .catch(() => {
    setStatusMsg('Unauthorized or Error loading plots!');
  })
        .then((res) => res.json())
        .then((data) => {
          setPlots(data.features);
          data.features.forEach((feature) => {
            const coords = feature.geometry.coordinates[0];
            const shape = new THREE.Shape();
            coords.forEach((point, idx) => {
              const [x, y] = point;
              if (idx === 0) shape.moveTo(x, y);
              else shape.lineTo(x, y);
            });
            const shapeGeometry = new THREE.ShapeGeometry(shape);
            const shapeMaterial = new THREE.MeshBasicMaterial({
              color: feature.properties.status === 'available' ? 0x00ff00 : 0xff0000,
              opacity: 0.5,
              transparent: true,
            });
            const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
            scene.add(mesh);
          });
          renderer.render(scene, camera);
        })
        .catch(() => {
          setStatusMsg('Error loading plots!');
        });

      // Animation loop for rendering
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    };

    // Handle canvas click for plot selection
    const handleClick = (event) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * img.width;
      const y = (1 - (event.clientY - rect.top) / rect.height) * img.height;
      const selected = plots.find((p) => {
        const coords = p.geometry.coordinates[0];
        let inside = false;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          const xi = coords[i][0], yi = coords[i][1];
          const xj = coords[j][0], yj = coords[j][1];
          if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
          }
        }
        return inside;
      });
      if (selected) {
        setSelectedPlot(selected);
        setShowBookingModal(true);
      }
    };
    canvasRef.current.addEventListener('click', handleClick);
    return () => {
    if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick);
    }
    };
  }, [plots]);

  const handleZoom = (zoomIn) => {
    const img = imageRef.current;
    controlsRef.current.scale *= zoomIn ? 1.2 : 0.8;
    cameraRef.current.left = -img.width / 2 / controlsRef.current.scale;
    cameraRef.current.right = img.width / 2 / controlsRef.current.scale;
    cameraRef.current.top = img.height / 2 / controlsRef.current.scale;
    cameraRef.current.bottom = -img.height / 2 / controlsRef.current.scale;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const handleReset = () => {
    const img = imageRef.current;
    controlsRef.current.scale = 1;
    controlsRef.current.offsetX = 0;
    controlsRef.current.offsetY = 0;
    cameraRef.current.left = 0;
    cameraRef.current.right = img.width;
    cameraRef.current.top = img.height;
    cameraRef.current.bottom = 0;
    cameraRef.current.position.set(img.width / 2, img.height / 2, 10);
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const filtered = plots.filter((p) => {
      const props = p.properties;
      return (
        (filters.status === 'all' || props.status === filters.status) &&
        (!filters.minArea || props.area >= parseFloat(filters.minArea)) &&
        (!filters.maxArea || props.area <= parseFloat(filters.maxArea))
      );
    });
    // Re-render plots based on filters
    sceneRef.current.children = sceneRef.current.children.filter((child) => child.type === 'Mesh' && child.geometry.type === 'PlaneGeometry');
    filtered.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      const shape = new THREE.Shape();
      coords.forEach((point, idx) => {
        const [x, y] = point;
        if (idx === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      const shapeGeometry = new THREE.ShapeGeometry(shape);
      const shapeMaterial = new THREE.MeshBasicMaterial({
        color: feature.properties.status === 'available' ? 0x00ff00 : 0xff0000,
        opacity: 0.5,
        transparent: true,
      });
      const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
      sceneRef.current.add(mesh);
    });
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    setShowFilterModal(false);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, plotNo: selectedPlot.properties.plotNo }),
      });
      if (res.ok) {
        setStatusMsg('Enquiry submitted successfully!');
        setFormData({ name: '', phone: '', email: '', message: '' });
        setShowBookingModal(false);
      } else {
        setStatusMsg('Error submitting enquiry!');
      }
    } catch (err) {
        console.log(err)
      setStatusMsg('Error submitting enquiry!');
    }
  };

  return (
    <Container fluid style={{ height: '100vh', background: '#1f2937', padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ color: '#16a34a', fontWeight: '500', padding: '8px', textAlign: 'center' }}>{statusMsg}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0, minWidth: 0 }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px' }}>
        <Button variant="light" onClick={() => handleZoom(true)} style={{ padding: '8px 16px', fontSize: '1.25rem', borderRadius: '6px' }}>+</Button>
        <Button variant="light" onClick={() => handleZoom(false)} style={{ padding: '8px 16px', fontSize: '1.25rem', borderRadius: '6px' }}>−</Button>
        <Button variant="light" onClick={() => setShowFilterModal(true)} style={{ padding: '8px 16px', fontSize: '1rem', borderRadius: '6px' }}>▼ Filter</Button>
        <Button variant="light" onClick={handleReset} style={{ padding: '8px 16px', fontSize: '1rem', borderRadius: '6px' }}>⟳ Reset</Button>
      </div>
      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Filter Plots</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFilterSubmit}>
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
              </Form.Select>
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
          </Form>
        </Modal.Body>
      </Modal>
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Book Plot {selectedPlot?.properties.plotNo}</Modal.Title>
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