import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Form, Container, Row, Col, Badge, Card, Button, Modal, Spinner } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { api, endpoints } from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// V2 Theme Colors
const colors = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  secondary: '#22d3ee',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
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
    marginBottom: 0,
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
  modalBody: {
    background: colors.cardBg,
    padding: '2rem',
  },
  modalFooter: {
    background: colors.cardBg,
    borderTop: `1px solid ${colors.cardBorder}`,
    padding: '1rem 2rem',
    borderRadius: '0 0 16px 16px',
  },
  formInput: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: colors.text,
    transition: 'all 0.3s ease',
  },
  formLabel: {
    color: colors.textMuted,
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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

// Status color mapping
const getStatusColor = (status) => {
  const statusColors = {
    available: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
    sold: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
    reserved: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
    blocked: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' },
  };
  return statusColors[status?.toLowerCase()] || statusColors.available;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const PlotManager = () => {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [ventures, setVentures] = useState([]);
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [formData, setFormData] = useState({});
  const [exporting, setExporting] = useState(false);

  // Fetch ventures on mount
  useEffect(() => {
    fetchVentures();
  }, []);

  // Fetch plots when venture changes
  useEffect(() => {
    fetchPlots();
  }, [selectedVentureId]);

  // V4: Fetch ventures from multi-tenant API
  const fetchVentures = async () => {
    try {
      const data = await api.get(endpoints.ventures.list);
      if (data.success && data.data) {
        setVentures(data.data);
        const defaultVenture = data.data.find(v => v.isDefault);
        if (defaultVenture) {
          setSelectedVentureId(defaultVenture._id);
        }
      }
    } catch (err) {
      console.error('Error fetching ventures:', err);
    }
  };

  // V4: Fetch plots from multi-tenant API
  const fetchPlots = async () => {
    try {
      setLoading(true);
      const endpoint = selectedVentureId
        ? endpoints.plots.byVenture(selectedVentureId)
        : endpoints.plots.list;

      const data = await api.get(endpoint);
      setPlots(data.features || data.data || []);
    } catch (err) {
      setStatusMsg('Error loading plots!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (plot) => {
    setSelectedPlot(plot);
    setShowViewModal(true);
  };

  const handleEditClick = (plot) => {
    setSelectedPlot(plot);
    setFormData({ ...plot.properties });
    setShowEditModal(true);
  };

  const handleDeleteClick = (plot) => {
    setSelectedPlot(plot);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setSelectedPlot(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // V4: Update plot using multi-tenant API
  const handleUpdatePlot = async () => {
    try {
      const updateData = {
        ...formData,
        area: parseFloat(formData.area),
        price: parseInt(formData.price),
      };
      const data = await api.put(endpoints.plots.update(selectedPlot.properties._id), updateData);

      if (data.success) {
        const updatedPlots = plots.map((plot) =>
          plot.properties._id === selectedPlot.properties._id
            ? { ...plot, properties: { ...plot.properties, ...formData } }
            : plot
        );
        setPlots(updatedPlots);
        setStatusMsg('Plot updated successfully!');
        handleModalClose();
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('Error updating plot!');
      }
    } catch (err) {
      setStatusMsg('Error updating plot!');
    }
  };

  // V4: Delete plot using multi-tenant API
  const handleDeletePlot = async () => {
    try {
      const data = await api.delete(endpoints.plots.delete(selectedPlot.properties._id));

      if (data.success) {
        setPlots(plots.filter(p => p.properties._id !== selectedPlot.properties._id));
        setStatusMsg('Plot deleted successfully!');
        handleModalClose();
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('Error deleting plot!');
      }
    } catch (err) {
      setStatusMsg('Error deleting plot!');
    }
  };

  // Filter plots
  const filteredPlots = plots.filter((plot) =>
    Object.values(plot.properties).some((val) =>
      val && val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Calculate stats
  const stats = {
    total: plots.length,
    available: plots.filter(p => p.properties.status?.toLowerCase() === 'available').length,
    sold: plots.filter(p => p.properties.status?.toLowerCase() === 'sold').length,
    reserved: plots.filter(p => p.properties.status?.toLowerCase() === 'reserved').length,
    totalArea: plots.reduce((sum, p) => sum + (parseFloat(p.properties.area) || 0), 0),
    totalRevenue: plots
      .filter(p => p.properties.status?.toLowerCase() === 'sold')
      .reduce((sum, p) => sum + (parseInt(p.properties.price) || 0), 0),
  };

  // Export to PDF - Detailed Brochure
  const exportToPDF = useCallback(() => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const ventureName = ventures.find(v => v._id === selectedVentureId)?.name || 'All Ventures';

      // Header with gradient
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 45, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('Plot Inventory Report', 15, 25);

      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${ventureName} | Generated: ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 15, 38);

      // Summary Cards
      doc.setTextColor(15, 23, 42);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 55, 85, 35, 3, 3, 'F');
      doc.roundedRect(110, 55, 85, 35, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INVENTORY SUMMARY', 20, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Plots: ${stats.total}`, 20, 75);
      doc.text(`Available: ${stats.available} | Sold: ${stats.sold} | Reserved: ${stats.reserved}`, 20, 82);

      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL SUMMARY', 115, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Area: ${stats.totalArea.toLocaleString()} sq.ft`, 115, 75);
      doc.text(`Revenue: ${formatCurrency(stats.totalRevenue)}`, 115, 82);

      // Table data
      const tableData = filteredPlots.map((plot, index) => {
        const p = plot.properties;
        return [
          index + 1,
          p.plotNo || '-',
          `${p.area || 0} sq.ft`,
          formatCurrency(p.price),
          (p.status || 'available').charAt(0).toUpperCase() + (p.status || 'available').slice(1),
          p.facing || '-',
          p.dimensions || '-'
        ];
      });

      doc.autoTable({
        startY: 100,
        head: [['#', 'Plot No', 'Area', 'Price', 'Status', 'Facing', 'Dimensions']],
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
          1: { cellWidth: 22 },
          2: { cellWidth: 28 },
          3: { cellWidth: 32 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 },
        },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount} | Plot3D V2 - Real Estate Management System`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`plot-inventory-${ventureName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      setStatusMsg('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      setStatusMsg('Error exporting PDF!');
    } finally {
      setExporting(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [filteredPlots, stats, ventures, selectedVentureId]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    setExporting(true);
    try {
      const ventureName = ventures.find(v => v._id === selectedVentureId)?.name || 'All Ventures';

      const worksheetData = filteredPlots.map((plot, index) => {
        const p = plot.properties;
        return {
          '#': index + 1,
          'Plot No': p.plotNo || '-',
          'Area (sq.ft)': p.area || 0,
          'Price (₹)': p.price || 0,
          'Status': (p.status || 'available').charAt(0).toUpperCase() + (p.status || 'available').slice(1),
          'Facing': p.facing || '-',
          'Dimensions': p.dimensions || '-',
          'Description': p.description || '-',
          'Created': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },   // #
        { wch: 12 },  // Plot No
        { wch: 15 },  // Area
        { wch: 15 },  // Price
        { wch: 12 },  // Status
        { wch: 12 },  // Facing
        { wch: 20 },  // Dimensions
        { wch: 40 },  // Description
        { wch: 15 },  // Created
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Plots');
      XLSX.writeFile(workbook, `plot-inventory-${ventureName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`);

      setStatusMsg('Excel exported successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      setStatusMsg('Error exporting Excel!');
    } finally {
      setExporting(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [filteredPlots, ventures, selectedVentureId]);

  // Export Single Plot Brochure
  const exportPlotBrochure = useCallback((plot) => {
    const p = plot.properties;
    const doc = new jsPDF();
    const ventureName = ventures.find(v => v._id === selectedVentureId)?.name || 'Premium Venture';

    // Header with gradient
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 60, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(`Plot #${p.plotNo}`, 105, 30, { align: 'center' });

    // Venture name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(ventureName, 105, 45, { align: 'center' });

    // Status badge
    const status = (p.status || 'available').toUpperCase();
    const statusX = 165;
    doc.setFontSize(10);
    doc.setFillColor(status === 'AVAILABLE' ? 34 : status === 'SOLD' ? 239 : 245,
      status === 'AVAILABLE' ? 197 : status === 'SOLD' ? 68 : 158,
      status === 'AVAILABLE' ? 94 : status === 'SOLD' ? 68 : 11);
    doc.roundedRect(statusX - 20, 50, 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(status, statusX, 56, { align: 'center' });

    // Main content area
    doc.setTextColor(15, 23, 42);

    // Price highlight
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 70, 180, 30, 5, 5, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(formatCurrency(p.price), 105, 90, { align: 'center' });

    // Details section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Details', 15, 120);

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(15, 125, 60, 125);

    // Details grid
    const details = [
      ['Area', `${p.area || 0} sq.ft`],
      ['Dimensions', p.dimensions || 'Not specified'],
      ['Facing', p.facing || 'Not specified'],
      ['Plot Number', p.plotNo || '-'],
    ];

    doc.setFontSize(11);
    let yPos = 140;
    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(value.toString(), 80, yPos);
      yPos += 12;
    });

    // Description
    if (p.description) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Description', 20, yPos + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const splitDescription = doc.splitTextToSize(p.description, 170);
      doc.text(splitDescription, 20, yPos + 22);
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by Plot3D V2 | Real Estate Management System', 105, 280, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 105, 286, { align: 'center' });

    doc.save(`plot-${p.plotNo}-brochure.pdf`);
    setStatusMsg('Brochure generated successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  }, [ventures, selectedVentureId]);

  return (
    <Container fluid style={styles.container}>
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div style={styles.header}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={styles.title}>🏠 Plot Manager</h1>
                <p style={styles.subtitle}>Manage and track plot inventory efficiently</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  style={styles.outlineButton}
                  onClick={exportToExcel}
                  disabled={exporting || filteredPlots.length === 0}
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
                  style={styles.outlineButton}
                  onClick={exportToPDF}
                  disabled={exporting || filteredPlots.length === 0}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = colors.danger;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = colors.cardBorder;
                  }}
                >
                  📄 Export PDF
                </button>
                <button
                  style={styles.actionButton}
                  onClick={() => navigate('/plot-drawer')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ✏️ Draw New Plot
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <Form.Control
                type="text"
                placeholder="🔍 Search by plot number, status, or details..."
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
                value={selectedVentureId}
                onChange={(e) => setSelectedVentureId(e.target.value)}
                style={{ ...styles.select, minWidth: '200px' }}
              >
                <option value="">All Ventures</option>
                {ventures.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} {v.isDefault ? '⭐' : ''}</option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
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
            <Card.Body style={{ padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                🗺️
              </div>
              <h3 style={{ ...styles.statValue, fontSize: '2rem' }}>{stats.total}</h3>
              <p style={styles.statLabel}>Total Plots</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={2} md={4} sm={6} className="mb-3">
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
            <Card.Body style={{ padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                ✅
              </div>
              <h3 style={{ ...styles.statValue, fontSize: '2rem' }}>{stats.available}</h3>
              <p style={styles.statLabel}>Available</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Card.Body style={{ padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                🏷️
              </div>
              <h3 style={{ ...styles.statValue, fontSize: '2rem' }}>{stats.sold}</h3>
              <p style={styles.statLabel}>Sold</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Card.Body style={{ padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                🔒
              </div>
              <h3 style={{ ...styles.statValue, fontSize: '2rem' }}>{stats.reserved}</h3>
              <p style={styles.statLabel}>Reserved</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={2} md={4} sm={6} className="mb-3">
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
            <Card.Body style={{ padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(34, 211, 238, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                📐
              </div>
              <h3 style={{ ...styles.statValue, fontSize: '1.5rem' }}>{stats.totalArea.toLocaleString()}</h3>
              <p style={styles.statLabel}>Total sq.ft</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={2} md={4} sm={6} className="mb-3">
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
            <Card.Body style={{ padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                💰
              </div>
              <h3 style={{ ...styles.statValue, fontSize: '1.25rem' }}>{formatCurrency(stats.totalRevenue)}</h3>
              <p style={styles.statLabel}>Revenue</p>
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
                  Plot Inventory
                </h3>
                <p style={{
                  color: colors.textMuted,
                  fontSize: '0.875rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  {filteredPlots.length} of {plots.length} plots
                </p>
              </div>
              {loading && (
                <Spinner animation="border" size="sm" style={{ color: colors.primary }} />
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table style={{ marginBottom: '0', borderCollapse: 'separate', borderSpacing: '0', background: 'transparent' }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Plot No</th>
                    <th style={styles.tableHeader}>Area</th>
                    <th style={styles.tableHeader}>Price</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Facing</th>
                    <th style={styles.tableHeader}>Dimensions</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                  {filteredPlots.map((plot, index) => {
                    const p = plot.properties;
                    const statusStyle = getStatusColor(p.status);

                    return (
                      <tr
                        key={p._id}
                        style={{
                          transition: 'all 0.15s ease',
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
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          background: 'transparent'
                        }}>
                          <span style={{ fontWeight: '600', color: colors.primary }}>#{p.plotNo}</span>
                        </td>

                        <td style={{
                          ...styles.tableCell,
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          color: '#f8fafc',
                          background: 'transparent'
                        }}>
                          <span style={{ color: '#f8fafc' }}>{p.area} sq.ft</span>
                        </td>

                        <td style={{
                          ...styles.tableCell,
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          fontWeight: '600',
                          color: '#f8fafc',
                          background: 'transparent'
                        }}>
                          <span style={{ color: '#f8fafc' }}>{formatCurrency(p.price)}</span>
                        </td>

                        <td style={{
                          ...styles.tableCell,
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          background: 'transparent'
                        }}>
                          <Badge style={{
                            ...styles.badge,
                            background: statusStyle.bg,
                            color: statusStyle.color
                          }}>
                            {(p.status || 'available').charAt(0).toUpperCase() + (p.status || 'available').slice(1)}
                          </Badge>
                        </td>

                        <td style={{
                          ...styles.tableCell,
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          background: 'transparent'
                        }}>
                          <span style={{ color: '#f8fafc' }}>{p.facing || '-'}</span>
                        </td>

                        <td style={{
                          ...styles.tableCell,
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          color: '#94a3b8',
                          background: 'transparent'
                        }}>
                          <span style={{ color: '#94a3b8' }}>{p.dimensions || '-'}</span>
                        </td>

                        <td style={{
                          ...styles.tableCell,
                          borderBottom: index === filteredPlots.length - 1 ? 'none' : styles.tableCell.borderBottom,
                          background: 'transparent'
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              style={{
                                background: 'rgba(34, 211, 238, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.4rem 0.6rem',
                                fontSize: '0.75rem',
                                color: '#22d3ee',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleViewClick(plot)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              style={{
                                background: 'rgba(99, 102, 241, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.4rem 0.6rem',
                                fontSize: '0.75rem',
                                color: '#6366f1',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleEditClick(plot)}
                              title="Edit Plot"
                            >
                              ✏️
                            </button>
                            <button
                              style={{
                                background: 'rgba(139, 92, 246, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.4rem 0.6rem',
                                fontSize: '0.75rem',
                                color: '#8b5cf6',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => exportPlotBrochure(plot)}
                              title="Download Brochure"
                            >
                              📄
                            </button>
                            <button
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.4rem 0.6rem',
                                fontSize: '0.75rem',
                                color: '#ef4444',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleDeleteClick(plot)}
                              title="Delete Plot"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPlots.length === 0 && !loading && (
                    <tr style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                      <td colSpan="7" style={{
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        border: 'none',
                        background: 'rgba(15, 23, 42, 0.8)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
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
                            🏠
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                              No plots found
                            </h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0' }}>
                              Try adjusting your search or venture filter
                            </p>
                          </div>
                          <button
                            style={styles.actionButton}
                            onClick={() => navigate('/plot-drawer')}
                          >
                            ✏️ Draw New Plot
                          </button>
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

      {/* Status Toast */}
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

      {/* View Modal */}
      <Modal show={showViewModal} onHide={handleModalClose} centered size="lg">
        <div style={styles.modal}>
          <Modal.Header style={styles.modalHeader}>
            <Modal.Title style={{ color: 'white', fontWeight: '700' }}>
              🏠 Plot Details
            </Modal.Title>
            <button onClick={handleModalClose} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>×</button>
          </Modal.Header>
          <Modal.Body style={styles.modalBody}>
            {selectedPlot && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {Object.entries(selectedPlot.properties).filter(([key]) => !key.startsWith('_')).map(([key, value]) => (
                  <div key={key} style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '10px'
                  }}>
                    <p style={{ color: colors.textDark, fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p style={{ color: colors.text, fontWeight: '600', margin: '0' }}>
                      {key === 'price' ? formatCurrency(value) : value?.toString() || '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={styles.modalFooter}>
            <button style={styles.outlineButton} onClick={handleModalClose}>Close</button>
            {selectedPlot && (
              <button style={styles.actionButton} onClick={() => exportPlotBrochure(selectedPlot)}>
                📄 Download Brochure
              </button>
            )}
          </Modal.Footer>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleModalClose} centered size="lg">
        <div style={styles.modal}>
          <Modal.Header style={styles.modalHeader}>
            <Modal.Title style={{ color: 'white', fontWeight: '700' }}>
              ✏️ Edit Plot
            </Modal.Title>
            <button onClick={handleModalClose} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>×</button>
          </Modal.Header>
          <Modal.Body style={styles.modalBody}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <Form.Group>
                <Form.Label style={styles.formLabel}>Plot Number</Form.Label>
                <Form.Control
                  type="text"
                  name="plotNo"
                  value={formData.plotNo || ''}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label style={styles.formLabel}>Area (sq.ft)</Form.Label>
                <Form.Control
                  type="number"
                  name="area"
                  value={formData.area || ''}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label style={styles.formLabel}>Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label style={styles.formLabel}>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status || 'available'}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                  <option value="blocked">Blocked</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label style={styles.formLabel}>Facing</Form.Label>
                <Form.Select
                  name="facing"
                  value={formData.facing || ''}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="">Select Facing</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North-East">North-East</option>
                  <option value="North-West">North-West</option>
                  <option value="South-East">South-East</option>
                  <option value="South-West">South-West</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label style={styles.formLabel}>Dimensions</Form.Label>
                <Form.Control
                  type="text"
                  name="dimensions"
                  value={formData.dimensions || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 30ft x 40ft"
                  style={styles.formInput}
                />
              </Form.Group>
              <Form.Group style={{ gridColumn: 'span 2' }}>
                <Form.Label style={styles.formLabel}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer style={styles.modalFooter}>
            <button style={styles.outlineButton} onClick={handleModalClose}>Cancel</button>
            <button style={styles.actionButton} onClick={handleUpdatePlot}>💾 Save Changes</button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleModalClose} centered>
        <div style={styles.modal}>
          <Modal.Header style={{ ...styles.modalHeader, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <Modal.Title style={{ color: 'white', fontWeight: '700' }}>
              🗑️ Delete Plot
            </Modal.Title>
            <button onClick={handleModalClose} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>×</button>
          </Modal.Header>
          <Modal.Body style={styles.modalBody}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                margin: '0 auto 1.5rem'
              }}>
                ⚠️
              </div>
              <h4 style={{ color: colors.text, margin: '0 0 0.5rem 0' }}>
                Are you sure you want to delete this plot?
              </h4>
              <p style={{ color: colors.textMuted, margin: '0' }}>
                {selectedPlot && `Plot #${selectedPlot.properties.plotNo} will be permanently removed.`}
              </p>
              <p style={{ color: colors.danger, fontSize: '0.85rem', marginTop: '1rem' }}>
                This action cannot be undone.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer style={styles.modalFooter}>
            <button style={styles.outlineButton} onClick={handleModalClose}>Cancel</button>
            <button
              style={{ ...styles.actionButton, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              onClick={handleDeletePlot}
            >
              🗑️ Delete Plot
            </button>
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
        
        .form-control:focus, .form-select:focus {
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
          background: rgba(15, 23, 42, 0.9) !important;
        }
      `}</style>
    </Container>
  );
};

export default PlotManager;