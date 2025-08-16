import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Form, Container, Row, Col, Badge, Card, Button, Modal } from 'react-bootstrap';
import '../../App.css';

const PlotManager = () => {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // Added for View modal
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [formData, setFormData] = useState({});

 useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('http://localhost:5000/api/plot', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPlots(data.features);
      })
      .catch(() => {
        setStatusMsg('Error loading plots!');
      });
  }, [navigate]);

  
  const handleViewClick = (plot) => { // Added for View modal
    setSelectedPlot(plot);
    setShowViewModal(true);
  };

   const handleEditClick = (plot) => {
    setSelectedPlot(plot);
    setFormData({ ...plot.properties });
    setShowEditModal(true);
  };

 const handleModalClose = () => {
    setShowEditModal(false);
    setShowViewModal(false); // Added for View modal
    setSelectedPlot(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

   const handleUpdatePlot = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`http://localhost:5000/api/plot/${selectedPlot.properties._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          area: parseFloat(formData.area),
          price: parseInt(formData.price),
        }),
      });
      if (res.ok) {
        const updatedPlots = plots.map((plot) =>
          plot.properties._id === selectedPlot.properties._id
            ? { ...plot, properties: { ...plot.properties, ...formData } }
            : plot
        );
        setPlots(updatedPlots);
        setStatusMsg('Plot updated successfully!');
        handleModalClose();
      } else {
        setStatusMsg('Error updating plot!');
      }
    } catch (err) {
      setStatusMsg('Error updating plot!');
      console.log(err);
    }
  };
const filteredPlots = plots.filter((plot) =>
    Object.values(plot.properties).some((val) =>
      val && val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const inputFocusStyles = {
    transition: 'all 0.2s ease',
  };

  const inputFocusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = '#3b82f6';
      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
      e.target.style.background = 'white';
    },
    onBlur: (e) => {
      e.target.style.borderColor = '#e2e8f0';
      e.target.style.boxShadow = 'none';
      e.target.style.background = '#fff';
    },
  };

  return (
    <Container fluid style={{
      background: '#f8fafc',
      minHeight: '100vh',
      padding: '2rem 1.5rem'
    }}>
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em'
            }}>
              Plot Manager
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              marginBottom: '2rem',
              fontWeight: '400'
            }}>
              Manage and track plot information efficiently
            </p>
            
            {/* Search Bar */}
            <Form.Control
              type="text"
              placeholder="Search by plot number, status, or other details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '400',
                transition: 'all 0.2s ease',
                maxWidth: '400px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
                e.target.style.background = '#f8fafc';
              }}
            />
          </div>
        </Col>
      </Row>

      {/* Analytics Cards */}
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-3">
          <Card style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  🗺️
                </div>
              </div>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                {plots.length}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: '500',
                margin: '0.25rem 0 0 0'
              }}>
                Total Plots
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={6} className="mb-3">
          <Card style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  🔍
                </div>
              </div>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                {filteredPlots.length}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: '500',
                margin: '0.25rem 0 0 0'
              }}>
                Filtered Results
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={6} className="mb-3">
          <Card style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  📈
                </div>
              </div>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                {plots.length > 0 ? Math.round((filteredPlots.length / plots.length) * 100) : 0}%
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: '500',
                margin: '0.25rem 0 0 0'
              }}>
                Match Rate
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Row>
        <Col>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0'
              }}>
                Plots Data
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                margin: '0.25rem 0 0 0'
              }}>
                {filteredPlots.length} of {plots.length} plots
              </p>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <Table style={{
                marginBottom: '0',
                borderCollapse: 'separate',
                borderSpacing: '0'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Plot No
                    </th>
                    <th style={{
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Facing
                    </th>
                    <th style={{
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Area (sq.yd)
                    </th>
                    <th style={{
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Price (₹)
                    </th>
                    <th style={{
                      padding: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlots.map((plot, index) => (
                    <tr 
                      key={plot.properties._id}
                      style={{
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredPlots.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <Badge style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          #{plot.properties.plotNo}
                        </Badge>
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredPlots.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <Badge style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {plot.properties.status}
                        </Badge>
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredPlots.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}>
                          {plot.properties.facing}
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredPlots.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}>
                          {plot.properties.area}
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredPlots.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}>
                          ₹{plot.properties.price}
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredPlots.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          style={{
                            marginRight: '0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            padding: '0.375rem 0.75rem'
                          }}
                          onClick={() => handleViewClick(plot)} // Updated to use handleViewClick
                        >
                          View
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          style={{
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            padding: '0.375rem 0.75rem',
                            background: 'linear-gradient(to right, #4f46e5, #3b82f6)', // Added gradient
                            border: 'none'
                          }}
                          onClick={() => handleEditClick(plot)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredPlots.length === 0 && (
                    <tr>
                      <td 
                        colSpan="6" 
                        style={{
                          padding: '4rem 2rem',
                          textAlign: 'center',
                          border: 'none'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                          }}>
                            📭
                          </div>
                          <div>
                            <h4 style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: '#374151',
                              margin: '0 0 0.5rem 0'
                            }}>
                              No plots found
                            </h4>
                            <p style={{
                              color: '#6b7280',
                              fontSize: '0.875rem',
                              margin: '0'
                            }}>
                              Try adjusting your search criteria to find what you're looking for
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </Col>
      </Row>

      {/* Status Message */}
      {statusMsg && (
        <Row className="mt-4">
          <Col>
            <div style={{
              background: statusMsg.includes('Error') ? '#fee2e2' : '#d1fae5',
              color: statusMsg.includes('Error') ? '#dc2626' : '#059669',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: `1px solid ${statusMsg.includes('Error') ? '#fecaca' : '#a7f3d0'}`,
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {statusMsg}
            </div>
          </Col>
        </Row>
      )}

      {/* View Modal */}
     <Modal 
  show={showViewModal} 
  onHide={handleModalClose} 
  centered 
  size="lg"
  style={{
    backdropFilter: 'blur(10px)'
  }}
>
  <Modal.Header 
    closeButton 
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px 12px 0 0',
      padding: '1.5rem'
    }}
  >
    <Modal.Title style={{
      fontSize: '1.25rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span style={{ fontSize: '1.5rem' }}>🏠</span>
      Plot Details #{selectedPlot?.properties.plotNo}
    </Modal.Title>
  </Modal.Header>
  
  <Modal.Body style={{
    padding: '2rem',
    background: '#f8fafc',
    maxHeight: '70vh',
    overflowY: 'auto'
  }}>
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem'
    }}>
      {/* Basic Information Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h5 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📊 Basic Information
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Plot Number
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              fontWeight: '500'
            }}>
              #{selectedPlot?.properties.plotNo || 'N/A'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Status
            </label>
            <Badge style={{
              background: selectedPlot?.properties.status === 'available' ? '#10b981' : 
                         selectedPlot?.properties.status === 'sold' ? '#ef4444' :
                         selectedPlot?.properties.status === 'booked' ? '#f59e0b' : '#6b7280',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {selectedPlot?.properties.status || 'N/A'}
            </Badge>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Facing Direction
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b'
            }}>
              {selectedPlot?.properties.facing || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Measurements & Pricing Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h5 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          💰 Measurements & Pricing
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Area
            </label>
            <div style={{
              background: '#dbeafe',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              fontWeight: '600'
            }}>
              {selectedPlot?.properties.area || 'N/A'} sq.yd
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Price
            </label>
            <div style={{
              background: '#dcfce7',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
              color: '#059669',
              fontWeight: '700'
            }}>
              ₹{selectedPlot?.properties.price ? Number(selectedPlot.properties.price).toLocaleString('en-IN') : 'N/A'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Measurements
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b'
            }}>
              {selectedPlot?.properties.measurements || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h5 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📍 Location Details
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Survey Number
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b'
            }}>
              {selectedPlot?.properties.surveyNo || 'N/A'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Location Pin
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b'
            }}>
              {selectedPlot?.properties.locationPin || 'N/A'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Address
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              lineHeight: '1.5'
            }}>
              {selectedPlot?.properties.address || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        gridColumn: 'span 2'
      }}>
        <h5 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 Additional Information
        </h5>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Boundaries
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              lineHeight: '1.5'
            }}>
              {selectedPlot?.properties.boundaries || 'N/A'}
            </div>
          </div>
          
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Plot Types
            </label>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b'
            }}>
              {selectedPlot?.properties.plotTypes || 'N/A'}
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              display: 'block'
            }}>
              Notes
            </label>
            <div style={{
              background: '#fef3c7',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              lineHeight: '1.5',
              minHeight: '3rem'
            }}>
              {selectedPlot?.properties.notes || 'No notes available'}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal.Body>
  
  <Modal.Footer style={{
    background: 'white',
    border: 'none',
    borderRadius: '0 0 12px 12px',
    padding: '1.5rem'
  }}>
    <Button
      variant="secondary"
      onClick={handleModalClose}
      style={{
        background: '#f1f5f9',
        color: '#64748b',
        border: 'none',
        borderRadius: '8px',
        padding: '0.75rem 1.5rem',
        fontWeight: '500',
        fontSize: '0.875rem'
      }}
    >
      Close
    </Button>
  </Modal.Footer>
</Modal>

      {/* Edit Modal */}
<Modal 
        show={showEditModal} 
        onHide={handleModalClose} 
        centered 
        size="xl"
        style={{
          backdropFilter: 'blur(10px)'
        }}
      >
        <Modal.Header 
          closeButton 
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px 12px 0 0',
            padding: '1.5rem'
          }}
        >
          <Modal.Title style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>✏️</span>
            Edit Plot #{selectedPlot?.properties.plotNo}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          padding: '2rem',
          background: '#f8fafc',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          <Form onSubmit={(e) => { e.preventDefault(); handleUpdatePlot(); }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {/* Basic Information Section */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📊 Basic Information
                </h5>
                
                <Form.Group className="mb-3">
                  <Form.Label style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    Plot Number
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="plotNo"
                    value={formData.plotNo || ''}
                    onChange={handleInputChange}
                    disabled
                    style={{
                      background: '#f1f5f9',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}
                    {...inputFocusHandlers}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    Status
                  </Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleInputChange}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                    {...inputFocusHandlers}
                  >
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
                  <Form.Label style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    Facing Direction
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="facing"
                    value={formData.facing || ''}
                    onChange={handleInputChange}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                    {...inputFocusHandlers}
                  />
                </Form.Group>
              </div>

              {/* Measurements & Pricing Section */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💰 Measurements & Pricing
                </h5>
                
                <Form.Group className="mb-3">
                  <Form.Label style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    Area (sq.yd)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="area"
                    value={formData.area || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                    {...inputFocusHandlers}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    Price (₹)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                    {...inputFocusHandlers}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    Measurements
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="measurements"
                    value={formData.measurements || ''}
                    onChange={handleInputChange}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                    {...inputFocusHandlers}
                  />
                </Form.Group>
              </div>

              {/* Location Details Section */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                gridColumn: 'span 2'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📍 Location & Additional Details
                </h5>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Survey Number
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="surveyNo"
                      value={formData.surveyNo || ''}
                      onChange={handleInputChange}
                      style={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                      {...inputFocusHandlers}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Location Pin
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="locationPin"
                      value={formData.locationPin || ''}
                      onChange={handleInputChange}
                      style={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                      {...inputFocusHandlers}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Plot Types
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="plotTypes"
                      value={formData.plotTypes || ''}
                      onChange={handleInputChange}
                      style={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                      {...inputFocusHandlers}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3" style={{ gridColumn: 'span 2' }}>
                    <Form.Label style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Address
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      style={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      {...inputFocusHandlers}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Boundaries
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="boundaries"
                      value={formData.boundaries || ''}
                      onChange={handleInputChange}
                      style={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      {...inputFocusHandlers}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Notes
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      style={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      {...inputFocusHandlers}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        
        <Modal.Footer style={{
          background: 'white',
          border: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '1.5rem',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Button
            variant="primary"
            onClick={handleUpdatePlot}
            style={{
              background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            💾 Save Changes
          </Button>
          <Button
            variant="secondary"
            onClick={handleModalClose}
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PlotManager;