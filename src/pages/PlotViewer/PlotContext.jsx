import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Modal, Button, Form, Badge } from 'react-bootstrap';


const PlotContext = createContext();

const PlotProvider = ({ children }) => {
  const [geoData, setGeoData] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({ plotNos: '', status: '', facing: '', type: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [formData, setFormData] = useState({ plotNo: '', area: '', name: '', contact: '' });

  const scene = useRef(new THREE.Scene());
  const camera = useRef(null);
  const renderer = useRef(null);
  const meshes = useRef([]);
  const plotNumberDivs = useRef([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const width = useRef(0);
  const height = useRef(0);

  const minZoom = 0.4;
  const maxZoom = 2.5;

  const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

  const value = {
    geoData,
    setGeoData,
    zoom,
    setZoom,
    cameraPos,
    setCameraPos,
    isDragging,
    setIsDragging,
    lastMouse,
    setLastMouse,
    selectedPlot,
    setSelectedPlot,
    showFilterModal,
    setShowFilterModal,
    filters,
    setFilters,
    showBookingModal,
    setShowBookingModal,
    formData,
    setFormData,
    scene,
    camera,
    renderer,
    meshes,
    plotNumberDivs,
    raycaster,
    mouse,
    width,
    height,
    minZoom,
    maxZoom,
    clamp,
  };

  return <PlotContext.Provider value={value}>{children}</PlotContext.Provider>;
};

export default PlotProvider