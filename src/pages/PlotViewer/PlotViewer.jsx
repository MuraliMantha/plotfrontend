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
  const imageRef = useRef(null);

  // 1. Setup Scene, Camera, Renderer and background image (run once)
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

      // Siteplan texture as plane
      const texture = new THREE.TextureLoader().load(siteplan);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(width, height);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(width / 2, height / 2, 0);
      scene.add(plane);

      renderer.render(scene, camera);

      // Fetch Plots AFTER scene loads
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
        })
        .catch(() => {
          setStatusMsg('Unauthorized or Error loading plots!');
        });
    };

    // Canvas click handler for selecting a plot
    const handleClick = (event) => {
      const img = imageRef.current;
      if (!img || plots.length === 0) return;
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
    canvasRef.current?.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      canvasRef.current?.removeEventListener('click', handleClick);
      // Optionally: cleanup THREE.js scene here
    };
    // eslint-disable-next-line
  }, []);

  // 2. Whenever plots change, update meshes
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return;

    // Remove previous plot meshes
    scene.children
      .filter(child => child.userData && child.userData.isPlot)
      .forEach(mesh => scene.remove(mesh));

    // Add new plot meshes
    plots.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      const shape = new THREE.Shape();
      coords.forEach(([x, y], idx) => {
        if (idx === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      const shapeGeometry = new THREE.ShapeGeometry(shape);
      const shapeMaterial = new THREE.MeshBasicMaterial({
        color:
          feature.properties.status === 'available' ? 0x00ff00
            : feature.properties.status === 'booked' ? 0xff9800
            : feature.properties.status === 'reserved' ? 0x2962ff
            : 0xff0000,
        opacity: 0.5,
        transparent: true,
      });
      const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
      mesh.userData.isPlot = true;
      scene.add(mesh);
    });

    renderer.render(scene, camera);
  }, [plots]);

  // 3. Zoom and Reset handlers (static camera)
  const handleZoom = (zoomIn) => {
    const img = imageRef.current;
    if (!img) return;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return;

    const scale = zoomIn ? 1.2 : 0.8;
    const w = img.width, h = img.height;
    camera.left *= scale;
    camera.right *= scale;
    camera.top *= scale;
    camera.bottom *= scale;
    camera.updateProjectionMatrix();
    renderer.render(sceneRef.current, camera);
  };

  const handleReset = () => {
    const img = imageRef.current;
    if (!img) return;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return;

    camera.left = 0;
    camera.right = img.width;
    camera.top = img.height;
    camera.bottom = 0;
    camera.position.set(img.width / 2, img.height / 2, 10);
    camera.updateProjectionMatrix();
    renderer.render(sceneRef.current, camera);
  };

  // 4. Filter plots
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/plot', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        let filtered = data.features.filter((p) => {
          const props = p.properties;
          return (
            (filters.status === 'all' || props.status === filters.status) &&
            (!filters.minArea || props.area >= parseFloat(filters.minArea)) &&
            (!filters.maxArea || props.area <= parseFloat(filters.maxArea))
          );
        });
        setPlots(filtered);
        setShowFilterModal(false);
      })
      .catch(() => setStatusMsg('Error filtering plots!'));
  };

  // 5. Enquiry Submit
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
