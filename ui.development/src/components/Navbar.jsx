import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <nav className="navbar glass">
            <div className="container">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        <span className="gradient-text">AI SaaS</span>
                    </Link>

                    <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
                        <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>

                    <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                        <Link to="/" className={`navbar-link ${isActive('/')}`} onClick={() => setIsMenuOpen(false)}>
                            Home
                        </Link>
                        <Link to="/services" className={`navbar-link ${isActive('/services')}`} onClick={() => setIsMenuOpen(false)}>
                            Services
                        </Link>
                        <Link to="/login" className={`navbar-link ${isActive('/login')}`} onClick={() => setIsMenuOpen(false)}>
                            Login
                        </Link>
                        <Link to="/signup" className={`navbar-link btn-primary ${isActive('/signup')}`} onClick={() => setIsMenuOpen(false)}>
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
