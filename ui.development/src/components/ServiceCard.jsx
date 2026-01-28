import React from 'react';
import './ServiceCard.css';

const ServiceCard = ({ icon, title, description, delay = 0 }) => {
    return (
        <div
            className="service-card glass"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="service-icon">{icon}</div>
            <h3 className="service-title">{title}</h3>
            <p className="service-description">{description}</p>
            <button className="btn btn-outline service-btn">
                Learn More
            </button>
        </div>
    );
};

export default ServiceCard;
