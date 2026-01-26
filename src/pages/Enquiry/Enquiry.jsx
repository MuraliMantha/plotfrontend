import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Form, Container, Row, Col, Badge, Card, Button, Modal } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import API_BASE from '../../config';

// V3 Theme Colors
const colors = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  secondary: '#22d3ee',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  dark: '#0f172a',
  darker: '#020617',
  cardBg: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(71, 85, 105, 0.5)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textDark: '#64748b',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
  glassGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
};

const styles = {
  container: {
    background: `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 100%)`,
    minHeight: '100vh',
    padding: '2rem',
  },
  header: {
    background: colors.cardBg,
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '2rem',
    border: `1px solid ${colors.cardBorder}`,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    background: colors.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: '1rem',
    marginBottom: '1.5rem',
  },
  searchInput: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: '12px',
    padding: '0.875rem 1rem',
    fontSize: '0.875rem',
    color: colors.text,
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  card: {
    background: colors.cardBg,
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: `1px solid ${colors.cardBorder}`,
    transition: 'all 0.3s ease',
    height: '100%',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: colors.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: '0.875rem',
    fontWeight: '500',
    margin: '0.25rem 0 0 0',
  },
  tableContainer: {
    background: colors.cardBg,
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: `1px solid ${colors.cardBorder}`,
    overflow: 'hidden',
  },
  tableHeader: {
    background: 'rgba(99, 102, 241, 0.15)',
    padding: '0.875rem 1rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: 'none',
    borderBottom: `1px solid ${colors.cardBorder}`,
  },
  tableRow: {
    background: 'rgba(15, 23, 42, 0.6)',
  },
  tableCell: {
    padding: '1rem',
    border: 'none',
    borderBottom: `1px solid rgba(71, 85, 105, 0.3)`,
    verticalAlign: 'middle',
    color: colors.text,
    background: 'transparent',
  },
  actionButton: {
    background: colors.gradient,
    border: 'none',
    borderRadius: '10px',
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  outlineButton: {
    background: 'transparent',
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: '10px',
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: colors.text,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  badge: {
    borderRadius: '8px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: 'none',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: colors.gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '1rem',
    flexShrink: 0,
  },
  modal: {
    background: colors.cardBg,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: '16px',
  },
  modalHeader: {
    background: colors.gradient,
    borderRadius: '16px 16px 0 0',
    padding: '1.5rem',
    border: 'none',
  },
  select: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: colors.text,
    cursor: 'pointer',
  },
};

const EnquiryManager = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, newLeadsCreated: 0, linkedToExisting: 0 });
  const [ventures, setVentures] = useState([]);
  const [selectedVenture, setSelectedVenture] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch data
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch enquiries (new API returns { success, data })
        const enquiriesRes = await fetch(`${API_BASE}/enquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const enquiriesData = await enquiriesRes.json();
        setEnquiries(enquiriesData.data || enquiriesData || []);

        // Fetch stats
        const statsRes = await fetch(`${API_BASE}/enquiries/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // Fetch ventures
        const venturesRes = await fetch(`${API_BASE}/ventures`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const venturesData = await venturesRes.json();
        setVentures(Array.isArray(venturesData) ? venturesData : (venturesData.data || []));

      } catch (error) {
        console.error('Error fetching data:', error);
        setStatusMsg('Error loading data!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Filter enquiries
  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch = Object.values(enq).some((val) =>
      val && val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesVenture = !selectedVenture || enq.ventureId === selectedVenture;
    return matchesSearch && matchesVenture;
  });

  // Export to PDF
  const exportToPDF = useCallback(() => {
    setExporting(true);
    try {
      const doc = new jsPDF();

      // Header with gradient effect simulation
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 40, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Enquiries Report', 15, 25);

      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 15, 35);

      // Summary section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 15, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Enquiries: ${filteredEnquiries.length}`, 15, 63);
      doc.text(`Unique Plots: ${new Set(filteredEnquiries.map(e => e.plotNo)).size}`, 15, 70);

      // Table data
      const tableData = filteredEnquiries.map((enq, index) => [
        index + 1,
        enq.name || '-',
        enq.phone || '-',
        enq.email || '-',
        enq.plotNo || '-',
        new Date(enq.time).toLocaleDateString('en-US'),
        (enq.message || '').substring(0, 30) + ((enq.message || '').length > 30 ? '...' : '')
      ]);

      doc.autoTable({
        startY: 80,
        head: [['#', 'Name', 'Phone', 'Email', 'Plot', 'Date', 'Message']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 28 },
          2: { cellWidth: 25 },
          3: { cellWidth: 40 },
          4: { cellWidth: 15 },
          5: { cellWidth: 22 },
          6: { cellWidth: 45 },
        },
        margin: { top: 80 },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount} | Plot3D V2 - Enquiry Management System`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`enquiries-report-${new Date().toISOString().split('T')[0]}.pdf`);
      setStatusMsg('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      setStatusMsg('Error exporting PDF!');
    } finally {
      setExporting(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [filteredEnquiries]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    setExporting(true);
    try {
      const worksheetData = filteredEnquiries.map((enq, index) => ({
        '#': index + 1,
        'Name': enq.name || '-',
        'Phone': enq.phone || '-',
        'Email': enq.email || '-',
        'Plot No': enq.plotNo || '-',
        'Message': enq.message || '-',
        'Date': new Date(enq.time).toLocaleDateString('en-US'),
        'Time': new Date(enq.time).toLocaleTimeString('en-US'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },   // #
        { wch: 25 },  // Name
        { wch: 15 },  // Phone
        { wch: 35 },  // Email
        { wch: 10 },  // Plot No
        { wch: 50 },  // Message
        { wch: 15 },  // Date
        { wch: 12 },  // Time
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries');
      XLSX.writeFile(workbook, `enquiries-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      setStatusMsg('Excel exported successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      setStatusMsg('Error exporting Excel!');
    } finally {
      setExporting(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [filteredEnquiries]);

  // View enquiry details
  const viewEnquiryDetails = (enq) => {
    setSelectedEnquiry(enq);
    setShowDetailModal(true);
  };

  // Get recent enquiries count (last 7 days)
  const recentEnquiriesCount = enquiries.filter(enq => {
    const enquiryDate = new Date(enq.time);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return enquiryDate >= weekAgo;
  }).length;

  // Get unique plots count
  const uniquePlotsCount = new Set(enquiries.map(e => e.plotNo)).size;

  return (
    <Container fluid style={styles.container}>
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div style={styles.header}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={styles.title}>📧 Enquiry Manager</h1>
                <p style={styles.subtitle}>Track and manage customer inquiries efficiently</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  style={styles.outlineButton}
                  onClick={exportToExcel}
                  disabled={exporting || filteredEnquiries.length === 0}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                    e.currentTarget.style.borderColor = colors.success;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = colors.cardBorder;
                  }}
                >
                  📊 Export Excel
                </button>
                <button
                  style={styles.actionButton}
                  onClick={exportToPDF}
                  disabled={exporting || filteredEnquiries.length === 0}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  📄 Export PDF
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <Form.Control
                type="text"
                placeholder="🔍 Search by name, phone, email, or plot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...styles.searchInput, flex: '1', minWidth: '250px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px rgba(99, 102, 241, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.cardBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <Form.Select
                value={selectedVenture}
                onChange={(e) => setSelectedVenture(e.target.value)}
                style={{ ...styles.select, minWidth: '200px' }}
              >
                <option value="">All Ventures</option>
                {ventures.map((v) => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                📊
              </div>
              <h3 style={styles.statValue}>{enquiries.length}</h3>
              <p style={styles.statLabel}>Total Enquiries</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(34, 211, 238, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(34, 211, 238, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                🔍
              </div>
              <h3 style={styles.statValue}>{filteredEnquiries.length}</h3>
              <p style={styles.statLabel}>Filtered Results</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(34, 197, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                ✨
              </div>
              <h3 style={styles.statValue}>{stats.newLeadsCreated}</h3>
              <p style={styles.statLabel}>New Leads Created</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Card.Body style={{ padding: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                🔗
              </div>
              <h3 style={styles.statValue}>{stats.linkedToExisting}</h3>
              <p style={styles.statLabel}>Linked to Existing</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Row>
        <Col>
          <div style={styles.tableContainer}>
            <div style={{
              padding: '1.5rem',
              borderBottom: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: colors.text,
                  margin: '0'
                }}>
                  Enquiries Data
                </h3>
                <p style={{
                  color: colors.textMuted,
                  fontSize: '0.875rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  {filteredEnquiries.length} of {enquiries.length} enquiries
                </p>
              </div>
              {loading && (
                <div style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                  Loading...
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table style={{
                marginBottom: '0',
                borderCollapse: 'separate',
                borderSpacing: '0',
                background: 'transparent'
              }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Customer</th>
                    <th style={styles.tableHeader}>Contact</th>
                    <th style={styles.tableHeader}>Lead Status</th>
                    <th style={styles.tableHeader}>Plot</th>
                    <th style={styles.tableHeader}>Date</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                  {filteredEnquiries.map((enq, index) => (
                    <tr
                      key={enq._id}
                      style={{
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        background: 'rgba(15, 23, 42, 0.6)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                      }}
                    >
                      <td style={{
                        ...styles.tableCell,
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : styles.tableCell.borderBottom,
                        background: 'transparent'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div style={styles.avatar}>
                            {enq.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#f8fafc',
                              fontSize: '0.9rem'
                            }}>
                              {enq.name}
                            </div>
                            <div style={{
                              color: '#94a3b8',
                              fontSize: '0.8rem'
                            }}>
                              {enq.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{
                        ...styles.tableCell,
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : styles.tableCell.borderBottom,
                        background: 'transparent'
                      }}>
                        <Badge style={{
                          ...styles.badge,
                          background: 'rgba(34, 211, 238, 0.2)',
                          color: '#22d3ee'
                        }}>
                          📞 {enq.phone}
                        </Badge>
                      </td>

                      <td style={{
                        ...styles.tableCell,
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : styles.tableCell.borderBottom,
                        background: 'transparent'
                      }}>
                        {enq.customerId ? (
                          <div>
                            <Badge style={{
                              ...styles.badge,
                              background: enq.isNewCustomer ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                              color: enq.isNewCustomer ? colors.success : colors.purple,
                              marginBottom: '4px'
                            }}>
                              {enq.isNewCustomer ? '✨ New Lead' : '🔗 Existing'}
                            </Badge>
                            <div style={{ marginTop: '4px' }}>
                              <button
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: colors.primary,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline'
                                }}
                                onClick={() => navigate(`/customers/${enq.customerId._id || enq.customerId}`)}
                              >
                                View in CRM →
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Badge style={{
                            ...styles.badge,
                            background: 'rgba(148, 163, 184, 0.2)',
                            color: colors.textMuted
                          }}>
                            ○ Not Linked
                          </Badge>
                        )}
                      </td>

                      <td style={{
                        ...styles.tableCell,
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : styles.tableCell.borderBottom,
                        background: 'transparent'
                      }}>
                        <Badge style={{
                          ...styles.badge,
                          background: colors.gradient,
                          color: 'white'
                        }}>
                          🏠 Plot #{enq.plotNo}
                        </Badge>
                      </td>

                      <td style={{
                        ...styles.tableCell,
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : styles.tableCell.borderBottom,
                        background: 'transparent'
                      }}>
                        <div style={{
                          color: '#f8fafc',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {new Date(enq.time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div style={{
                          color: '#64748b',
                          fontSize: '0.75rem'
                        }}>
                          {new Date(enq.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      <td style={{
                        ...styles.tableCell,
                        borderBottom: index === filteredEnquiries.length - 1 ? 'none' : styles.tableCell.borderBottom,
                        background: 'transparent'
                      }}>
                        <button
                          style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            color: '#6366f1',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => viewEnquiryDetails(enq)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#6366f1';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                            e.currentTarget.style.color = '#6366f1';
                          }}
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredEnquiries.length === 0 && !loading && (
                    <tr style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                      <td
                        colSpan="6"
                        style={{
                          padding: '4rem 2rem',
                          textAlign: 'center',
                          border: 'none',
                          background: 'rgba(15, 23, 42, 0.8)'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem'
                          }}>
                            📭
                          </div>
                          <div>
                            <h4 style={{
                              fontSize: '1.25rem',
                              fontWeight: '600',
                              color: '#f8fafc',
                              margin: '0 0 0.5rem 0'
                            }}>
                              No enquiries found
                            </h4>
                            <p style={{
                              color: '#94a3b8',
                              fontSize: '0.9rem',
                              margin: '0'
                            }}>
                              Try adjusting your search criteria or venture filter
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

      {/* Status Message Toast */}
      {statusMsg && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: statusMsg.includes('Error') ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          fontSize: '0.9rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideIn 0.3s ease',
          zIndex: 9999
        }}>
          {statusMsg.includes('Error') ? '❌' : '✅'} {statusMsg}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        size="lg"
      >
        <div style={styles.modal}>
          <Modal.Header style={styles.modalHeader}>
            <Modal.Title style={{ color: 'white', fontWeight: '700' }}>
              📧 Enquiry Details
            </Modal.Title>
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </Modal.Header>
          <Modal.Body style={{ padding: '2rem', background: colors.cardBg }}>
            {selectedEnquiry && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Customer Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    ...styles.avatar,
                    width: '64px',
                    height: '64px',
                    fontSize: '1.5rem'
                  }}>
                    {selectedEnquiry.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 style={{ color: colors.text, fontWeight: '600', margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>
                      {selectedEnquiry.name}
                    </h4>
                    <p style={{ color: colors.textMuted, margin: '0', fontSize: '0.9rem' }}>
                      {selectedEnquiry.email}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '10px'
                  }}>
                    <p style={{ color: colors.textDark, fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                      Phone
                    </p>
                    <p style={{ color: colors.text, fontWeight: '600', margin: '0' }}>
                      📞 {selectedEnquiry.phone}
                    </p>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '10px'
                  }}>
                    <p style={{ color: colors.textDark, fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                      Plot Number
                    </p>
                    <p style={{ color: colors.text, fontWeight: '600', margin: '0' }}>
                      🏠 Plot #{selectedEnquiry.plotNo}
                    </p>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '10px',
                    gridColumn: 'span 2'
                  }}>
                    <p style={{ color: colors.textDark, fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                      Enquiry Date
                    </p>
                    <p style={{ color: colors.text, fontWeight: '600', margin: '0' }}>
                      📅 {new Date(selectedEnquiry.time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '12px',
                  borderLeft: `4px solid ${colors.primary}`
                }}>
                  <p style={{ color: colors.textDark, fontSize: '0.75rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                    Message
                  </p>
                  <p style={{ color: colors.text, margin: '0', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {selectedEnquiry.message || 'No message provided'}
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{
            background: colors.cardBg,
            borderTop: `1px solid ${colors.cardBorder}`,
            padding: '1rem 2rem',
            borderRadius: '0 0 16px 16px'
          }}>
            <Button
              variant="secondary"
              onClick={() => setShowDetailModal(false)}
              style={styles.outlineButton}
            >
              Close
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .modal-content {
          background: transparent !important;
          border: none !important;
        }
        
        .form-control::placeholder {
          color: ${colors.textDark} !important;
        }
        

        
        .form-select option {
          background: ${colors.dark};
          color: ${colors.text};
        }
      `}</style>
    </Container>
  );
};

export default EnquiryManager;