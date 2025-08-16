import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Form, Container, Row, Col, Badge, Card } from 'react-bootstrap';
import '../../App.css'

const EnquiryManager = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('http://localhost:5000/api/enquiries', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setEnquiries(data);
      })
      .catch(() => {
        setStatusMsg('Error loading enquiries!');
      });
  }, [navigate]);

  const filteredEnquiries = enquiries.filter((enq) =>
    Object.values(enq).some((val) =>
      val && val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
              User Enquiries
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              marginBottom: '2rem',
              fontWeight: '400'
            }}>
              Manage and track customer inquiries efficiently
            </p>
            
            {/* Search Bar */}
            <Form.Control
              type="text"
              placeholder="Search by name, phone, email, or plot number..."
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
                maxWidth: '400px',
                ':focus': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }
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
                  📊
                </div>
              </div>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                {enquiries.length}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: '500',
                margin: '0.25rem 0 0 0'
              }}>
                Total Enquiries
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
                {filteredEnquiries.length}
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
                {enquiries.length > 0 ? Math.round((filteredEnquiries.length / enquiries.length) * 100) : 0}%
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
                Enquiries Data
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                margin: '0.25rem 0 0 0'
              }}>
                {filteredEnquiries.length} of {enquiries.length} enquiries
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
                      Customer
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
                      Contact
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
                      Message
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
                      Plot
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
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((enq, index) => (
                    <tr 
                      key={enq._id}
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
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            flexShrink: 0
                          }}>
                            {enq.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '500',
                              color: '#1e293b',
                              fontSize: '0.875rem'
                            }}>
                              {enq.name}
                            </div>
                            <div style={{
                              color: '#64748b',
                              fontSize: '0.75rem'
                            }}>
                              {enq.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : '1px solid #f1f5f9',
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
                          {enq.phone}
                        </Badge>
                      </td>
                      
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle',
                        maxWidth: '250px'
                      }}>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textOverflow: 'ellipsis'
                        }}>
                          {enq.message}
                        </div>
                      </td>
                      
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : '1px solid #f1f5f9',
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
                          #{enq.plotNo}
                        </Badge>
                      </td>
                      
                      <td style={{
                        padding: '1rem',
                        border: 'none',
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : '1px solid #f1f5f9',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{
                          color: '#64748b',
                          fontSize: '0.875rem'
                        }}>
                          {new Date(enq.time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.75rem'
                        }}>
                          {new Date(enq.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredEnquiries.length === 0 && (
                    <tr>
                      <td 
                        colSpan="5" 
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
                              No enquiries found
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
    </Container>
  );
};

export default EnquiryManager;