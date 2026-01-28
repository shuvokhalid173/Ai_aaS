import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content animate-fade-in">
                        <h1 className="hero-title">
                            Welcome to <span className="gradient-text">AI SaaS Platform</span>
                        </h1>
                        <p className="hero-subtitle">
                            Empower your business with cutting-edge AI services. From smart assistants to developer tools,
                            we've got everything you need to scale and succeed.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn btn-primary">
                                Get Started Free
                            </Link>
                            <Link to="/services" className="btn btn-secondary">
                                Explore Services
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <div className="container">
                    <h2 className="section-title gradient-text">Why Choose Us?</h2>
                    <div className="features-grid">
                        <div className="feature-item animate-scale-in" style={{ animationDelay: '100ms' }}>
                            <div className="feature-icon">🚀</div>
                            <h3>Lightning Fast</h3>
                            <p>Optimized performance for real-time AI processing</p>
                        </div>
                        <div className="feature-item animate-scale-in" style={{ animationDelay: '200ms' }}>
                            <div className="feature-icon">🔒</div>
                            <h3>Secure & Private</h3>
                            <p>Enterprise-grade security for your data</p>
                        </div>
                        <div className="feature-item animate-scale-in" style={{ animationDelay: '300ms' }}>
                            <div className="feature-icon">🎯</div>
                            <h3>Easy Integration</h3>
                            <p>Simple APIs to integrate with your existing tools</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
