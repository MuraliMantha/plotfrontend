import React, { useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text } from "react-konva";
import useImage from "use-image";
import siteplan from '../../assets/siteplan.png';

const PlotDrawer = () => {
  // Load image from assets folder
  const [image] = useImage(siteplan); // Update this path to match your assets structure
  
  const [points, setPoints] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Enhanced form data matching your schema
  const [formData, setFormData] = useState({
    plotNo: "",
    status: "Available",
    facing: "",
    area: "",
    price: "",
    surveyNo: "",
    locationPin: "",
    boundaries: "",
    notes: "",
    plotTypes: "",
    address: "",
    measurements: ""
  });

  // Load existing plots on component mount
  useEffect(() => {
    fetchExistingPlots();
  }, []);

  const fetchExistingPlots = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:5000/api/plot', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Convert backend data to display format
          const convertedPolygons = data.data.map(plot => ({
            id: plot._id,
            plotNo: plot.plotNo,
            price: plot.price,
            area: plot.area,
            geometry: plot.geometry,
            // Convert coordinates back to points array for Konva
            points: plot.geometry?.coordinates?.[0]?.flat() || []
          }));
          setPolygons(convertedPolygons);
        }
      }
    } catch (error) {
      console.error("Error fetching plots:", error);
      setError("Failed to load existing plots");
    }
  };

  const handleClick = (e) => {
    if (showForm) return; // Don't add points while form is open
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setPoints([...points, point.x, point.y]);
  };

  const handleCompletePolygon = () => {
    if (points.length >= 6) {
      setShowForm(true);
      setError("");
      setSuccess("");
    } else {
      setError("Please click at least 3 points to create a polygon");
    }
  };

  const handleCancelDrawing = () => {
    setPoints([]);
    setShowForm(false);
    setFormData({
      plotNo: "",
      status: "Available",
      facing: "",
      area: "",
      price: "",
      surveyNo: "",
      locationPin: "",
      boundaries: "",
      notes: "",
      plotTypes: "",
      address: "",
      measurements: ""
    });
    setError("");
    setSuccess("");
  };

  const handleFormSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Convert points to coordinate pairs and close the loop
      const groupedPoints = [];
      for (let i = 0; i < points.length; i += 2) {
        groupedPoints.push([points[i], points[i + 1]]);
      }
      groupedPoints.push(groupedPoints[0]); // Close the polygon loop

      const plotData = {
        ...formData,
        area: parseFloat(formData.area) || 0,
        price: parseFloat(formData.price) || 0,
        geometry: {
          type: "Polygon",
          coordinates: [groupedPoints]
        }
      };
      const token = localStorage.getItem('admin_token');
      console.log("tokennnnnnnnnn", token);
      const response = await fetch("http://localhost:5000/api/plot/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(plotData),
      });
      console.log("137", plotData);

      const result = await response.json();

      if (response.ok && result.success) {
        // Add to local state for immediate display
        const newPolygon = {
          id: result.data._id,
          plotNo: formData.plotNo,
          price: formData.price,
          area: formData.area,
          geometry: plotData.geometry,
          points: [...points]
        };

        setPolygons([...polygons, newPolygon]);
        setSuccess(`Plot ${formData.plotNo} saved successfully!`);
        
        // Reset form
        handleCancelDrawing();
      } else {
        setError(result.message || "Failed to save plot");
      }
    } catch (error) {
      console.error("Error saving plot:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Plot Layout Designer</h1>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full max-w-4xl">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 w-full max-w-4xl">
          {success}
        </div>
      )}

      {/* Canvas */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <Stage 
          width={1000} 
          height={700} 
          onClick={handleClick} 
          className="border border-gray-300 rounded cursor-crosshair"
        >
          <Layer>
            {image && <KonvaImage image={image} />}

            {/* Existing Polygons */}
            {polygons.map((poly) => (
              <React.Fragment key={poly.id}>
                <Line 
                  points={poly.points} 
                  closed 
                  stroke="green" 
                  strokeWidth={2} 
                  fill="rgba(0, 255, 0, 0.1)"
                />
                <Text
                  x={poly.points[0] || 0}
                  y={(poly.points[1] || 0) - 25}
                  text={`Plot ${poly.plotNo}`}
                  fontSize={14}
                  fill="blue"
                  fontStyle="bold"
                />
              </React.Fragment>
            ))}

            {/* Current Drawing Line */}
            {points.length > 0 && (
              <Line 
                points={points} 
                stroke="red" 
                strokeWidth={3} 
                closed={false}
                dash={[5, 5]}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-4">
        <button 
          onClick={handleCompletePolygon} 
          disabled={points.length < 6 || showForm}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Complete Polygon ({points.length / 2} points)
        </button>
        
        <button 
          onClick={handleCancelDrawing}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Cancel/Reset
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Enter Plot Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Plot Number *"
                  value={formData.plotNo}
                  onChange={(e) => handleInputChange("plotNo", e.target.value)}
                  required
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                />
                
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Facing"
                  value={formData.facing}
                  onChange={(e) => handleInputChange("facing", e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                />
                
                <input
                  type="number"
                  placeholder="Area (sq ft) *"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  required
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <input
                type="number"
                placeholder="Price *"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                required
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="Survey Number"
                value={formData.surveyNo}
                onChange={(e) => handleInputChange("surveyNo", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="Location Pin"
                value={formData.locationPin}
                onChange={(e) => handleInputChange("locationPin", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
              />

              <textarea
                placeholder="Address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
                rows="2"
              />

              <textarea
                placeholder="Boundaries"
                value={formData.boundaries}
                onChange={(e) => handleInputChange("boundaries", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
                rows="2"
              />

              <input
                type="text"
                placeholder="Plot Type"
                value={formData.plotTypes}
                onChange={(e) => handleInputChange("plotTypes", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="Measurements"
                value={formData.measurements}
                onChange={(e) => handleInputChange("measurements", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500"
                rows="3"
              />

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleFormSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex-1 transition-colors"
                >
                  {loading ? "Saving..." : "Save Plot"}
                </button>
                
                <button 
                  onClick={handleCancelDrawing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 text-center max-w-2xl">
        <p className="mb-2">
          <strong>Instructions:</strong> Click on the layout to add points for your polygon. 
          You need at least 3 points to complete a polygon.
        </p>
        <p>Existing plots are shown in green. Current drawing is shown in red dashed lines.</p>
      </div>
    </div>
  );
};

export default PlotDrawer;



// import React, { useState, useEffect, useCallback } from "react";
// import { Stage, Layer, Image as KonvaImage, Line, Text } from "react-konva";
// import useImage from "use-image";
// import siteplan from '../../assets/siteplan.png';

// const PlotDrawer = () => {
//   // Load image from assets folder
//   const [image] = useImage(siteplan);
  
//   const [points, setPoints] = useState([]);
//   const [polygons, setPolygons] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
  
//   const initialFormData = {
//     plotNo: "",
//     status: "Available",
//     facing: "",
//     area: "",
//     price: "",
//     surveyNo: "",
//     locationPin: "",
//     boundaries: "",
//     notes: "",
//     plotTypes: "",
//     address: "",
//     measurements: ""
//   };

//   const [formData, setFormData] = useState(initialFormData);

//   // Memoized fetch function to prevent unnecessary recreations
//   const fetchExistingPlots = useCallback(async () => {
//     try {
//       const token = localStorage.getItem('admin_token');
//       const response = await fetch('http://localhost:5000/api/plot', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
      
//       if (data.success && Array.isArray(data.data)) {
//         const convertedPolygons = data.data.map(plot => ({
//           id: plot._id,
//           plotNo: plot.plotNo,
//           price: plot.price,
//           area: plot.area,
//           geometry: plot.geometry,
//           points: plot.geometry?.coordinates?.[0]?.flat() || []
//         }));
//         setPolygons(convertedPolygons);
//       }
//     } catch (error) {
//       console.error("Error fetching plots:", error);
//       setError("Failed to load existing plots. Please try again later.");
//     }
//   }, []);

//   // Load existing plots on component mount
//   useEffect(() => {
//     fetchExistingPlots();
//   }, [fetchExistingPlots]);

//   const handleClick = (e) => {
//     if (showForm) return;
    
//     const stage = e.target.getStage();
//     const point = stage.getPointerPosition();
//     setPoints(prev => [...prev, point.x, point.y]);
//   };

//   const handleCompletePolygon = () => {
//     if (points.length >= 6) {
//       setShowForm(true);
//       setError("");
//       setSuccess("");
//     } else {
//       setError("Please click at least 3 points to create a polygon");
//       setTimeout(() => setError(""), 3000);
//     }
//   };

//   const resetDrawing = () => {
//     setPoints([]);
//     setFormData(initialFormData);
//     setError("");
//     setSuccess("");
//   };

//   const handleCancelDrawing = () => {
//     resetDrawing();
//     setShowForm(false);
//   };

//   const validateForm = () => {
//     if (!formData.plotNo.trim()) {
//       setError("Plot number is required");
//       return false;
//     }
//     if (!formData.area || isNaN(formData.area)) {
//       setError("Valid area is required");
//       return false;
//     }
//     if (!formData.price || isNaN(formData.price)) {
//       setError("Valid price is required");
//       return false;
//     }
//     return true;
//   };

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       // Convert points to coordinate pairs and close the loop
//       const groupedPoints = [];
//       for (let i = 0; i < points.length; i += 2) {
//         groupedPoints.push([points[i], points[i + 1]]);
//       }
//       groupedPoints.push(groupedPoints[0]); // Close the polygon loop

//       const plotData = {
//         ...formData,
//         area: parseFloat(formData.area),
//         price: parseFloat(formData.price),
//         geometry: {
//           type: "Polygon",
//           coordinates: [groupedPoints]
//         }
//       };

//       const token = localStorage.getItem('admin_token');
//       const response = await fetch("http://localhost:5000/api/plot/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(plotData),
//       });

//       const result = await response.json();

//       if (!response.ok || !result.success) {
//         throw new Error(result.message || "Failed to save plot");
//       }

//       // Add to local state for immediate display
//       const newPolygon = {
//         id: result.data._id,
//         plotNo: formData.plotNo,
//         price: formData.price,
//         area: formData.area,
//         geometry: plotData.geometry,
//         points: [...points]
//       };

//       setPolygons(prev => [...prev, newPolygon]);
//       setSuccess(`Plot ${formData.plotNo} saved successfully!`);
//       setTimeout(() => setSuccess(""), 5000);
      
//       // Reset form and drawing
//       resetDrawing();
//       setShowForm(false);
//     } catch (error) {
//       console.error("Error saving plot:", error);
//       setError(error.message || "Network error. Please try again.");
//       setTimeout(() => setError(""), 5000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   return (
//     <div className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4 text-gray-800">Plot Layout Designer</h1>
      
//       {/* Status Messages */}
//       <div className="w-full max-w-4xl">
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-fade-in">
//             {error}
//           </div>
//         )}
//         {success && (
//           <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fade-in">
//             {success}
//           </div>
//         )}
//       </div>

//       {/* Canvas */}
//       <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
//         <Stage 
//           width={1000} 
//           height={700} 
//           onClick={handleClick} 
//           className="border border-gray-300 rounded cursor-crosshair"
//         >
//           <Layer>
//             {image && <KonvaImage image={image} />}

//             {/* Existing Polygons */}
//             {polygons.map((poly) => (
//               <React.Fragment key={poly.id}>
//                 <Line 
//                   points={poly.points} 
//                   closed 
//                   stroke="green" 
//                   strokeWidth={2} 
//                   fill="rgba(0, 255, 0, 0.1)"
//                 />
//                 <Text
//                   x={poly.points[0] || 0}
//                   y={(poly.points[1] || 0) - 25}
//                   text={`Plot ${poly.plotNo}`}
//                   fontSize={14}
//                   fill="blue"
//                   fontStyle="bold"
//                 />
//               </React.Fragment>
//             ))}

//             {/* Current Drawing Line */}
//             {points.length > 0 && (
//               <Line 
//                 points={points} 
//                 stroke="red" 
//                 strokeWidth={3} 
//                 closed={false}
//                 dash={[5, 5]}
//               />
//             )}
//           </Layer>
//         </Stage>
//       </div>

//       {/* Controls */}
//       <div className="flex gap-4 mb-4">
//         <button 
//           onClick={handleCompletePolygon} 
//           disabled={points.length < 6 || showForm}
//           className={`px-6 py-2 rounded-lg font-medium transition-colors ${
//             points.length < 6 || showForm 
//               ? "bg-gray-400 cursor-not-allowed" 
//               : "bg-green-600 hover:bg-green-700 text-white"
//           }`}
//         >
//           Complete Polygon ({points.length / 2} points)
//         </button>
        
//         <button 
//           onClick={handleCancelDrawing}
//           className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//         >
//           Cancel/Reset
//         </button>
//       </div>

//       {/* Form Modal */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold text-gray-800">Plot Details</h2>
//               <button 
//                 onClick={handleCancelDrawing}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
            
//             <form onSubmit={handleFormSubmit} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Plot Number *</label>
//                   <input
//                     type="text"
//                     name="plotNo"
//                     value={formData.plotNo}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
//                   <select
//                     name="status"
//                     value={formData.status}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="Available">Available</option>
//                     <option value="Sold">Sold</option>
//                     <option value="Reserved">Reserved</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Facing</label>
//                   <input
//                     type="text"
//                     name="facing"
//                     value={formData.facing}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq ft) *</label>
//                   <input
//                     type="number"
//                     name="area"
//                     value={formData.area}
//                     onChange={handleInputChange}
//                     required
//                     min="0"
//                     step="0.01"
//                     className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
//                 <input
//                   type="number"
//                   name="price"
//                   value={formData.price}
//                   onChange={handleInputChange}
//                   required
//                   min="0"
//                   step="0.01"
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Survey Number</label>
//                 <input
//                   type="text"
//                   name="surveyNo"
//                   value={formData.surveyNo}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Location Pin</label>
//                 <input
//                   type="text"
//                   name="locationPin"
//                   value={formData.locationPin}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//                 <textarea
//                   name="address"
//                   value={formData.address}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   rows="2"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Boundaries</label>
//                 <textarea
//                   name="boundaries"
//                   value={formData.boundaries}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   rows="2"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Plot Type</label>
//                 <input
//                   type="text"
//                   name="plotTypes"
//                   value={formData.plotTypes}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Measurements</label>
//                 <input
//                   type="text"
//                   name="measurements"
//                   value={formData.measurements}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//                 <textarea
//                   name="notes"
//                   value={formData.notes}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   rows="3"
//                 />
//               </div>

//               <div className="flex gap-4 pt-4">
//                 <button 
//                   type="submit"
//                   disabled={loading}
//                   className={`flex-1 px-6 py-2 rounded-lg font-medium transition-colors ${
//                     loading 
//                       ? "bg-blue-400 cursor-not-allowed" 
//                       : "bg-blue-600 hover:bg-blue-700 text-white"
//                   }`}
//                 >
//                   {loading ? (
//                     <span className="flex items-center justify-center">
//                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Saving...
//                     </span>
//                   ) : "Save Plot"}
//                 </button>
                
//                 <button 
//                   type="button"
//                   onClick={handleCancelDrawing}
//                   className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Instructions */}
//       <div className="text-sm text-gray-600 text-center max-w-2xl">
//         <p className="mb-2">
//           <strong>Instructions:</strong> Click on the layout to add points for your polygon. 
//           You need at least 3 points to complete a polygon.
//         </p>
//         <p>Existing plots are shown in green. Current drawing is shown in red dashed lines.</p>
//       </div>
//     </div>
//   );
// };

// export default PlotDrawer;