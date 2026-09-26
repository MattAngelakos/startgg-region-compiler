import React from 'react';
import Header from './Header';

// Shared placeholder for every page's loading state. Renders the real page
// chrome plus skeleton cards shaped like the content that is coming, so the
// layout does not jump when the data lands.
const LoadingScreen = ({ label = 'Loading…', rows = 4, link, linkname }) => {
    return (
        <div className="app">
            <Header link={link} linkname={linkname} />
            <main>
                <div className="loading" role="status" aria-live="polite">
                    <span className="spinner" aria-hidden="true" />
                    <span>{label}</span>
                </div>
                <div className="skeleton-list" aria-hidden="true">
                    {Array.from({ length: rows }).map((unused, index) => (
                        <div className="skeleton-card" key={index}>
                            <div className="skeleton-avatar" />
                            <div className="skeleton-lines">
                                <div className="skeleton-line skeleton-title" />
                                <div className="skeleton-line skeleton-meta" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default LoadingScreen;
