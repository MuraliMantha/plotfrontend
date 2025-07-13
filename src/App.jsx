import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import Login from './pages/Login/Login'
import Admin from './pages/Admin/Admin'
import PlotViewer from './pages/PlotViewer/PlotViewer'


const App = () => {
  return (
    <div className="container mt-4">
      <nav className="mb-3">
        <Link className="btn btn-primary me-2" to="/">Home</Link>
        <Link className="btn btn-secondary" to="/about">About</Link>
        <Link className="btn btn-info" to="/login">Login</Link>
        <Link className="btn btn-success" to="/admin">Admin</Link>
        <Link className="btn btn-success" to="/plot">Plot</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/plot" element={<PlotViewer />} />
      </Routes>
    </div>
  )
}

export default App
