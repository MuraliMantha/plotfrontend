import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Modal, Button, Form, Container, Badge, Spinner } from 'react-bootstrap';
import { api, endpoints } from '../../utils/api';
import './PlotViewer.css';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PlotViewer = () => {
  // REFS
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const plotLabelContainerRef = useRef(null);

  // V3: MOBILE RESPONSIVE STATE
  const [isMobile, setIsMobile] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });
  const lastPinchDistanceRef = useRef(0);

  // V2: VENTURE STATE
  const [ventures, setVentures] = useState([]);
  const [selectedVenture, setSelectedVenture] = useState(null);
  const [venturesLoading, setVenturesLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  // STATE
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

  // Internals
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const imageRef = useRef(null);
  const imagePlaneRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const plotNumberDivsRef = useRef([]);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const minZoom = 0.4;
  const maxZoom = 15;

  // For overlay
  const [hoverData, setHoverData] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const [imageWidth, setImageWidth] = useState(null);
  const [imageHeight, setImageHeight] = useState(null);

  // V3: Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // V2: Fetch ventures on mount
  useEffect(() => {
    fetchVentures();
  }, []);

  // V4: Fetch ventures using multi-tenant API
  const fetchVentures = async () => {
    try {
      setVenturesLoading(true);

      // Use V1 API - get all ventures
      const allData = await api.get(endpoints.ventures.list);

      if (allData.success) {
        setVentures(allData.data);
        // Set default or first venture
        const defaultVenture = allData.data.find(v => v.isDefault) || allData.data[0];
        if (defaultVenture) {
          setSelectedVenture(defaultVenture);
          setCurrentImageUrl(defaultVenture.imageUrl.startsWith('http') ? defaultVenture.imageUrl : `${API_BASE}${defaultVenture.imageUrl}`);
        }
      }
    } catch (err) {
      console.error('Error fetching ventures:', err);
      setStatusMsg('Failed to load ventures');
    } finally {
      setVenturesLoading(false);
    }
  };

  const handleVentureChange = (ventureId) => {
    const venture = ventures.find(v => v._id === ventureId);
    if (venture) {
      setSelectedVenture(venture);
      setCurrentImageUrl(venture.imageUrl.startsWith('http') ? venture.imageUrl : `${API_BASE}${venture.imageUrl}`);
      setPlots([]);
    }
  };

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
    if (!currentImageUrl || !selectedVenture) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageUrl;
    imageRef.current = img;

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      setImageWidth(originalWidth);
      setImageHeight(originalHeight);

      // Calculate display size that fits within the container while maintaining aspect ratio
      const container = canvasWrapperRef.current;
      const maxDisplayWidth = container ? container.clientWidth - 40 : 900; // 40px padding
      const maxDisplayHeight = container ? container.clientHeight - 40 : 600;

      const aspectRatio = originalWidth / originalHeight;
      let displayWidth = maxDisplayWidth;
      let displayHeight = displayWidth / aspectRatio;

      // If height exceeds max, recalculate based on height
      if (displayHeight > maxDisplayHeight) {
        displayHeight = maxDisplayHeight;
        displayWidth = displayHeight * aspectRatio;
      }

      // Round to avoid subpixel rendering issues
      displayWidth = Math.round(displayWidth);
      displayHeight = Math.round(displayHeight);

      // Scene - create new or reuse
      let scene = sceneRef.current;
      if (!scene) {
        scene = new THREE.Scene();
        sceneRef.current = scene;
      } else {
        // Clear existing objects
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
      }

      // Camera: Use original image coordinates for proper plot positioning
      const camera = new THREE.OrthographicCamera(
        0, originalWidth, originalHeight, 0, -100, 100
      );
      camera.position.set(0, 0, 10);
      cameraRef.current = camera;
      zoomRef.current = 1;

      // Renderer - set to display size for proper aspect ratio
      if (!rendererRef.current) {
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
        rendererRef.current = renderer;
      }
      // Configure renderer for correct color output (preserves original image colors)
      rendererRef.current.outputColorSpace = THREE.SRGBColorSpace;
      // Set the renderer size to calculated display dimensions (maintains aspect ratio)
      rendererRef.current.setSize(displayWidth, displayHeight);
      // Scale the internal buffer to match the original image resolution for crisp rendering
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Image plane - use original dimensions for proper coordinate mapping
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(currentImageUrl, (loadedTexture) => {
        // Set texture color space to sRGB to match the output
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
      });
      // Also set color space immediately for consistency
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(originalWidth, originalHeight);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(originalWidth / 2, originalHeight / 2, -1);
      scene.add(plane);
      imagePlaneRef.current = plane;

      fetchPlots();

      const animate = () => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          updatePlotNumbers();
        }
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


    // V3: Touch event handlers for mobile
    const getTouchDistance = (touches) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Pinch gesture start
        e.preventDefault();
        isDraggingRef.current = false;
        lastPinchDistanceRef.current = getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e) => {
      const camera = cameraRef.current;
      if (!camera) return;

      if (e.touches.length === 1 && isDraggingRef.current) {
        // Single finger pan
        const dx = e.touches[0].clientX - lastMouseRef.current.x;
        const dy = e.touches[0].clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const worldDX = (dx / rect.width) * (camera.right - camera.left);
        const worldDY = (dy / rect.height) * (camera.top - camera.bottom);

        camera.left -= worldDX;
        camera.right -= worldDX;
        camera.top += worldDY;
        camera.bottom += worldDY;
        camera.updateProjectionMatrix();
        updatePlotNumbers();
      } else if (e.touches.length === 2) {
        // Pinch to zoom
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const pinchDelta = currentDistance - lastPinchDistanceRef.current;

        if (Math.abs(pinchDelta) > 2) {
          const zoomIn = pinchDelta > 0;
          const prevZoom = zoomRef.current;
          const newZoom = clamp(prevZoom * (zoomIn ? 1.03 : 0.97), minZoom, maxZoom);

          if (newZoom !== prevZoom) {
            zoomRef.current = newZoom;
            const width = imageRef.current.width / newZoom;
            const height = imageRef.current.height / newZoom;
            const cx = (camera.left + camera.right) / 2;
            const cy = (camera.top + camera.bottom) / 2;
            camera.left = cx - width / 2;
            camera.right = cx + width / 2;
            camera.top = cy + height / 2;
            camera.bottom = cy - height / 2;
            camera.updateProjectionMatrix();
            updatePlotNumbers();
          }
          lastPinchDistanceRef.current = currentDistance;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        // Check for tap (click on plot)
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = Math.abs(touchEnd.x - touchStartRef.current.x);
        const dy = Math.abs(touchEnd.y - touchStartRef.current.y);

        if (dx < 10 && dy < 10) {
          // This was a tap, not a drag
          const rect = canvasRef.current.getBoundingClientRect();
          const mx = touchEnd.x - rect.left;
          const my = touchEnd.y - rect.top;

          mouseRef.current.x = (mx / rect.width) * 2 - 1;
          mouseRef.current.y = -((my / rect.height) * 2 - 1);
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

          const intersects = raycasterRef.current.intersectObjects(
            sceneRef.current.children.filter(c => c.userData && c.userData.isPlot)
          );

          if (intersects.length > 0 && intersects[0].object.visible) {
            setSelectedPlot(intersects[0].object.userData);
            setShowPlotDialog(true);
          }
        }
        isDraggingRef.current = false;
      }
      lastPinchDistanceRef.current = 0;
    };

    canvasRef.current?.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvasRef.current?.addEventListener('mousemove', handleMouseMove);
    canvasRef.current?.addEventListener('click', handleClick);
    canvasRef.current?.addEventListener('wheel', handleWheel, { passive: false });

    // V3: Mobile touch events
    canvasRef.current?.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasRef.current?.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasRef.current?.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current?.removeEventListener('click', handleClick);
      canvasRef.current?.removeEventListener('wheel', handleWheel);
      canvasRef.current?.removeEventListener('touchstart', handleTouchStart);
      canvasRef.current?.removeEventListener('touchmove', handleTouchMove);
      canvasRef.current?.removeEventListener('touchend', handleTouchEnd);
    };
    // eslint-disable-next-line
  }, [currentImageUrl, selectedVenture, windowSize]);

  // 2. Fetch Plots and Poll for Updates
  const fetchPlots = () => {
    if (!selectedVenture) return;

    const url = `${API_BASE}/api/v1/plots?ventureId=${selectedVenture._id}`;
    fetch(url, {
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
        setPlots(data.features || []);
        setLastLoadedGeoJSON(data);
      })
      .catch((err) => {
        console.error('Error fetching plots:', err);
      });
  };

  // Poll for updates every 5s
  useEffect(() => {
    if (!selectedVenture) return;

    const interval = setInterval(() => {
      const url = `${API_BASE}/api/v1/plots?ventureId=${selectedVenture._id}`;
      fetch(url, {
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
            setPlots(data.features || []);
            setLastLoadedGeoJSON(data);
          }
        })
        .catch((err) => {
          console.error('Error polling plots:', err);
        });
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [lastLoadedGeoJSON, selectedVenture]);

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

      // // Use inline styles to fully neutralize any pill/box coming from other rules
      // Object.assign(div.style, {
      //   position: 'absolute',
      //   pointerEvents: 'none',
      //   userSelect: 'none',

      //   /* remove any box visuals */
      //   background: 'transparent',
      //   backgroundColor: 'transparent',
      //   boxShadow: 'none',
      //   border: 'none',
      //   outline: 'none',
      //   padding: '0',
      //   borderRadius: '0',

      //   /* text styling */
      //   color: '#ffffff',
      //   fontSize: '12px',
      //   fontWeight: '700',
      //   textShadow: '0 0 3px rgba(0,0,0,0.9)',

      //   /* positioning - will be overwritten by updatePlotNumbers */
      //   transform: 'translate(-50%, -50%)',
      //   zIndex: 12
      // });

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
    const renderer = rendererRef.current;
    if (!camera || !canvas || !renderer) return;

    // Get the actual canvas dimensions from the renderer
    const canvasRect = canvas.getBoundingClientRect();
    const w = canvasRect.width;
    const h = canvasRect.height;

    // Position the label container to match the canvas
    const labelContainer = plotLabelContainerRef.current;
    if (labelContainer) {
      labelContainer.style.width = `${w}px`;
      labelContainer.style.height = `${h}px`;
      // Center the label container over the canvas
      labelContainer.style.position = 'absolute';
      labelContainer.style.left = `${canvasRect.left - canvasWrapperRef.current.getBoundingClientRect().left}px`;
      labelContainer.style.top = `${canvasRect.top - canvasWrapperRef.current.getBoundingClientRect().top}px`;
    }

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
        div.style.transform = `translate(-50%, -50%) scale(${zoomRef.current})`;
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

  // 7. Status Bar - V3 Responsive
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

    // Responsive badge style
    const badgeStyle = {
      fontSize: isMobile ? '0.7rem' : '0.85rem',
      padding: isMobile ? '3px 6px' : '4px 10px',
      margin: isMobile ? '0 2px' : '0 4px',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      display: 'inline-block'
    };

    return (
      <div
        className="status-bar status-bar-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '4px' : '8px',
          flexWrap: isMobile ? 'nowrap' : 'wrap'
        }}
      >
        <span className="status-badge status-total" style={badgeStyle}>🗺️ {isMobile ? '' : 'Total: '}{counts.total}</span>
        <span className="status-badge status-available" style={badgeStyle}>✔️ {isMobile ? '' : 'Available: '}{counts.available}</span>
        {!isMobile && <span className="status-badge status-hold" style={badgeStyle}>⏸️ Hold: {counts.hold}</span>}
        <span className="status-badge status-sold" style={badgeStyle}>❌ {isMobile ? '' : 'Sold: '}{counts.sold}</span>
        {!isMobile && <span className="status-badge status-tentative" style={badgeStyle}>❎ Tentatively Booked: {counts.tentatively_booked}</span>}
        {!isMobile && <span className="status-badge status-cip" style={badgeStyle}>✖️ CIP: {counts.cip}</span>}
        <span className="status-badge status-booked" style={badgeStyle}>📜 {isMobile ? '' : 'Booked: '}{counts.booked}</span>
        {!isMobile && <span className="status-badge status-reserved" style={badgeStyle}>🔒 Reserved: {counts.reserved}</span>}
      </div>
    );
  };

  // 8. Filter Plots
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/api/plot`, {
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
      const res = await fetch(`${API_BASE}/api/v1/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          ...formData,
          plotNo: selectedPlot.plotNo,
          ventureId: selectedVenture?._id
        }),
      });
      if (res.ok) {
        setStatusMsg('Enquiry submitted successfully!');
        setFormData({ name: '', phone: '', email: '', message: '' });
        setShowBookingModal(false);
        setShowPlotDialog(false);
      } else {
        const data = await res.json();
        setStatusMsg(data.message || 'Error submitting enquiry!');
      }
    } catch (err) {
      setStatusMsg('Error submitting enquiry!');
    }
  };

  // ---- RENDER ----
  return (
    <Container fluid style={{ height: '100vh', background: '#0f172a', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* V3: Responsive Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '0.5rem' : '0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '1rem',
          justifyContent: isMobile ? 'space-between' : 'flex-start'
        }}>
          <h4 style={{
            color: '#fff',
            margin: 0,
            fontWeight: '600',
            fontSize: isMobile ? '1rem' : '1.25rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isMobile ? '150px' : 'none'
          }}>
            🗺️ {selectedVenture?.name || 'Plot Viewer'}
          </h4>
          {ventures.length > 1 && (
            <Form.Select
              size="sm"
              value={selectedVenture?._id || ''}
              onChange={(e) => handleVentureChange(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '8px',
                maxWidth: isMobile ? '140px' : '200px',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem'
              }}
            >
              {ventures.map(v => (
                <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>
                  {v.name}
                </option>
              ))}
            </Form.Select>
          )}
          {venturesLoading && <Spinner animation="border" size="sm" variant="light" />}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
          {selectedVenture && (
            <>
              <Badge bg="info" style={{ borderRadius: '20px', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                📊 {plots.length} plots
              </Badge>
              {!isMobile && (
                <Badge
                  bg={selectedVenture.calibration?.isCalibrated ? 'success' : 'warning'}
                  style={{ borderRadius: '20px' }}
                >
                  {selectedVenture.calibration?.isCalibrated ? '✓ Calibrated' : '⚠ Not Calibrated'}
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div style={{
          color: '#16a34a',
          fontWeight: '500',
          padding: isMobile ? '6px' : '8px',
          textAlign: 'center',
          background: 'rgba(22, 163, 74, 0.1)',
          fontSize: isMobile ? '0.8rem' : '0.875rem'
        }}>
          {statusMsg}
        </div>
      )}
      {/* V3: Responsive Status Bar */}
      <div style={{
        padding: isMobile ? '4px 8px' : '8px',
        background: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        flexShrink: 0,
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {renderStatusBar()}
      </div>
      {/* V3: Responsive Canvas Container */}
      <div
        ref={canvasWrapperRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2937',
          overflow: 'hidden',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            touchAction: 'none',
            // Dimensions are set programmatically by Three.js renderer
            // to maintain correct aspect ratio
          }}
        />
        <div
          ref={plotLabelContainerRef}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 11
            // Position and dimensions are set dynamically in updatePlotNumbers
            // to match the actual canvas position
          }}
        />
        {/* Hover Overlay - Hide on mobile (use tap to select instead) */}
        {hoverData && !isMobile && (
          <div
            style={{
              position: 'fixed',
              left: Math.min(hoverPos.x + 16, windowSize.width - 200),
              top: Math.min(hoverPos.y + 16, windowSize.height - 150),
              background: '#fff',
              color: '#000',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              zIndex: 1001,
              pointerEvents: 'none',
              fontSize: '14px',
              lineHeight: '1.6',
              maxWidth: '220px'
            }}
          >
            <div style={{ color: '#000', fontWeight: '700', marginBottom: '4px', fontSize: '15px' }}>
              Plot #{hoverData.plotNo || 'N/A'}
            </div>
            <div style={{ color: '#333' }}><b style={{ color: '#000' }}>Area:</b> {hoverData.area ? hoverData.area + ' sq.yd' : 'N/A'}</div>
            <div style={{ color: '#333' }}><b style={{ color: '#000' }}>Status:</b> <span style={{
              color: hoverData.status?.toLowerCase() === 'available' ? '#16a34a' :
                hoverData.status?.toLowerCase() === 'sold' ? '#dc2626' :
                  hoverData.status?.toLowerCase() === 'reserved' ? '#d97706' : '#333',
              fontWeight: '600'
            }}>{hoverData.status || 'N/A'}</span></div>
            <div style={{ color: '#333' }}><b style={{ color: '#000' }}>Price:</b> {hoverData.price ? '₹' + hoverData.price.toLocaleString() : 'N/A'}</div>
          </div>
        )}
      </div>
      {/* V3: Responsive Floating Toolbar */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '12px' : '16px',
        right: isMobile ? '8px' : '16px',
        left: isMobile ? '8px' : 'auto',
        display: 'flex',
        gap: isMobile ? '6px' : '8px',
        zIndex: 2000,
        justifyContent: isMobile ? 'center' : 'flex-end',
        flexWrap: 'wrap'
      }}>
        <Button
          variant="light"
          onClick={() => handleZoom(true)}
          style={{
            padding: isMobile ? '10px 16px' : '8px 16px',
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            borderRadius: '8px',
            minWidth: isMobile ? '44px' : 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >+</Button>
        <Button
          variant="light"
          onClick={() => handleZoom(false)}
          style={{
            padding: isMobile ? '10px 16px' : '8px 16px',
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            borderRadius: '8px',
            minWidth: isMobile ? '44px' : 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >−</Button>
        <Button
          variant="light"
          onClick={() => setShowFilterModal(true)}
          style={{
            padding: isMobile ? '10px 12px' : '8px 16px',
            fontSize: isMobile ? '0.85rem' : '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >{isMobile ? '🔍' : '▼ Filter'}</Button>
        <Button
          variant="light"
          onClick={handleReset}
          style={{
            padding: isMobile ? '10px 12px' : '8px 16px',
            fontSize: isMobile ? '0.85rem' : '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >{isMobile ? '↻' : '⟳ Reset'}</Button>
      </div>
      {/* V3: Responsive Filter Modal */}
      <Modal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        centered
        fullscreen={isMobile ? true : undefined}
        size={isMobile ? undefined : 'md'}
      >
        <Modal.Header closeButton style={{
          background: isMobile ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
          color: isMobile ? 'white' : undefined
        }}>
          <Modal.Title style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            🔍 Filter Plots
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          padding: isMobile ? '1rem' : '1.5rem',
          overflowY: 'auto'
        }}>
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
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexDirection: isMobile ? 'column' : 'row',
              marginTop: '1rem'
            }}>
              <Button
                variant="primary"
                type="submit"
                style={{
                  background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
                  border: 'none',
                  padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                  flex: isMobile ? 'none' : 1
                }}
              >
                ✓ Apply Filters
              </Button>
              <Button
                variant="secondary"
                onClick={() => setFilters({ plotNos: '', status: 'all', facing: '', plotTypes: '', minArea: '', maxArea: '' })}
                style={{
                  padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                  flex: isMobile ? 'none' : 1
                }}
              >
                ↻ Reset Filters
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* V3: Responsive Plot Dialog */}
      <Modal
        show={showPlotDialog}
        onHide={() => setShowPlotDialog(false)}
        centered
        fullscreen={isMobile ? true : undefined}
        size={isMobile ? undefined : 'lg'}
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
            borderRadius: isMobile ? '0' : '0.375rem 0.375rem 0 0',
            padding: isMobile ? '1rem' : '1.5rem'
          }}
        >
          <Modal.Title
            style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.75rem',
              flexWrap: 'wrap'
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
            maxHeight: isMobile ? 'none' : '70vh',
            overflowY: 'auto'
          }}
        >
          {selectedPlot && (
            <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>

              {/* Price Highlight Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  borderRadius: '0.75rem',
                  padding: isMobile ? '1.25rem' : '2rem',
                  textAlign: 'center',
                  marginBottom: isMobile ? '1rem' : '1.5rem',
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
      {/* V3: Responsive Booking Modal */}
      <Modal
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        centered
        fullscreen={isMobile ? true : undefined}
        size={isMobile ? undefined : 'lg'}
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
            borderRadius: isMobile ? '0' : '0.375rem 0.375rem 0 0',
            padding: isMobile ? '1rem' : '1.5rem'
          }}
        >
          <Modal.Title
            style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.75rem'
            }}
          >
            🎯 Book Plot {selectedPlot?.plotNo}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            padding: '0',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: isMobile ? '1rem' : '2rem' }}>

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
