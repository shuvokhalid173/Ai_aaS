import React from 'react';
import ServiceCard from '../components/ServiceCard';
import './Services.css';

const Services = () => {
    const services = [
        {
            icon: '🤖',
            title: 'AI-Powered Smart Assistant',
            description: 'Intelligent conversational AI that understands context and provides personalized customer support. Automate responses, handle inquiries 24/7, and boost customer engagement with natural language processing.'
        },
        {
            icon: '🎯',
            title: 'Lead Scoring Service',
            description: 'Machine learning-powered lead qualification and prioritization system. Analyze customer behavior, predict conversion probability, and focus your sales efforts on the most promising opportunities.'
        },
        {
            icon: '📊',
            title: 'Conversion Event Data (CAPI)',
            description: 'Automated event tracking and data synchronization to Meta, Google, and HubSpot via Conversion API. Track user actions, optimize ad campaigns, and improve marketing ROI with accurate data.'
        },
        {
            icon: '📄',
            title: 'Massive Document Summarizer',
            description: 'AI-driven summarization engine for large document sets. Extract key insights from PDFs, reports, and articles in seconds. Perfect for research, legal documents, and business intelligence.'
        },
        {
            icon: '⚡',
            title: 'Developer Tools (LLM Powered)',
            description: 'Advanced development toolkit powered by large language models. Generate code, debug issues, optimize performance, and get intelligent suggestions to accelerate your development workflow.'
        }
    ];

    return (
        <div className="services-page">
            <div className="container">
                <div className="services-header animate-fade-in">
                    <h1 className="services-title gradient-text">Our Services</h1>
                    <p className="services-subtitle">
                        Explore our comprehensive suite of AI-powered services designed to transform your business
                    </p>
                </div>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <ServiceCard
                            key={index}
                            icon={service.icon}
                            title={service.title}
                            description={service.description}
                            delay={index * 100}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Services;
