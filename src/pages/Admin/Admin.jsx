import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Navbar, Table, Button, Form, Badge } from 'react-bootstrap';

const Admin = () => {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Load plots
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

    // Load enquiries
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

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  const handleUpdatePlot = async (index, buttonRef) => {
    const plot = plots[index];
    const row = buttonRef.parentElement.parentElement;
    const inputs = row.querySelectorAll('input, select');
    const data = {
      plotNo: inputs[0].value,
      status: inputs[1].value,
      facing: inputs[2].value,
      area: parseFloat(inputs[3].value),
      price: parseInt(inputs[4].value),
      surveyNo: inputs[5].value,
      locationPin: inputs[6].value,
      boundaries: inputs[7].value,
      notes: inputs[8].value,
      plotTypes: inputs[9].value,
      address: inputs[10].value,
      measurements: inputs[11].value,
    };

    buttonRef.textContent = 'Saving...';
    buttonRef.disabled = true;
    const badge = buttonRef.nextElementSibling;

    try {
      const res = await fetch(`http://localhost:5000/api/plot/${plot.properties._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        buttonRef.textContent = 'Save';
        buttonRef.disabled = false;
        badge.style.display = 'inline-block';
        setTimeout(() => {
          badge.style.display = 'none';
        }, 1400);
        const updatedPlots = [...plots];
        updatedPlots[index].properties = { ...updatedPlots[index].properties, ...data };
        setPlots(updatedPlots);
      } else {
        buttonRef.textContent = 'Error!';
        buttonRef.disabled = false;
      }
    } catch (err) {
      buttonRef.textContent = 'Error!';
      buttonRef.disabled = false;
      setStatusMsg('Error updating plot!');
      console.log(err)
    }
  };

  const filteredEnquiries = enquiries.filter((enq) =>
    Object.values(enq).some((val) =>
      val && val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      <Navbar bg="light" expand="lg" sticky="top" style={{ minWidth: '340px', padding: '0 16px', height: '64px' }}>
        <Navbar.Brand style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800', color: '#2563eb' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <rect x="4" y="7" width="20" height="14" rx="4" fill="url(#g1)" />
              <rect x="10" y="2" width="8" height="8" rx="2" fill="#fff" opacity="0.7" />
            </svg>
          </span>
          Plot3D
        </Navbar.Brand>
        <Navbar.Text style={{ flex: 1, textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
          Admin Panel
        </Navbar.Text>
        <Button
          variant="primary"
          onClick={handleLogout}
          style={{ background: 'linear-gradient(to right, #4f46e5, #3b82f6)', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '600' }}
        >
          Logout
        </Button>
      </Navbar>
      <Container style={{ maxWidth: '95vw', margin: '36px auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', overflowX: 'auto', minWidth: '340px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span>🗺️</span> Plot Manager
        </h2>
        <Table bordered hover responsive style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', fontWeight: '600', color: '#374151' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Plot No</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Facing</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Area (sq.yd)</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Price (₹)</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Survey No</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Location Pin</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Boundaries</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Plot Types</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Measurements</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Update</th>
            </tr>
          </thead>
          <tbody>
            {plots.map((feature, idx) => {
              const p = feature.properties;
              return (
                <tr key={p._id} style={{ background: '#fff', '&:hover': { background: '#f9fafb' } }}>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.plotNo} disabled style={{ width: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#e5e7eb', color: '#6b7280', fontWeight: '600' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Select defaultValue={p.status} style={{ width: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                    </Form.Select>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.facing} style={{ width: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="number" defaultValue={p.area} step="0.01" style={{ width: '96px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="number" defaultValue={p.price} style={{ width: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.surveyNo} style={{ width: '96px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.locationPin} style={{ width: '112px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.boundaries} style={{ width: '208px', minWidth: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.notes} style={{ width: '208px', minWidth: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.plotTypes} style={{ width: '96px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.address} style={{ width: '208px', minWidth: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Form.Control type="text" defaultValue={p.measurements} style={{ width: '208px', minWidth: '128px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button
                      variant="primary"
                      onClick={(e) => handleUpdatePlot(idx, e.target)}
                      style={{ background: 'linear-gradient(to right, #4f46e5, #3b82f6)', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '600' }}
                    >
                      Save
                    </Button>
                    <Badge bg="success" style={{ display: 'none', marginLeft: '8px', padding: '6px 12px', borderRadius: '9999px', fontWeight: '600' }}>
                      Saved!
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <div style={{ color: '#16a34a', fontWeight: '500', marginTop: '16px' }}>{statusMsg}</div>
        <div style={{ height: '32px' }}></div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span>📥</span> User Enquiries
        </h2>
        <Form.Control
          type="text"
          placeholder="Search name, phone, plot..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '256px', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
        <Table bordered hover responsive style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', fontWeight: '600', color: '#374151' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Message</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Plot No</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.map((enq) => (
              <tr key={enq._id} style={{ background: '#fff', '&:hover': { background: '#f9fafb' } }}>
                <td style={{ padding: '12px' }}>{enq.name}</td>
                <td style={{ padding: '12px' }}>{enq.phone}</td>
                <td style={{ padding: '12px' }}>{enq.email}</td>
                <td style={{ padding: '12px' }}>{enq.message}</td>
                <td style={{ padding: '12px' }}>{enq.plotNo}</td>
                <td style={{ padding: '12px' }}>{new Date(enq.time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
};

export default Admin;