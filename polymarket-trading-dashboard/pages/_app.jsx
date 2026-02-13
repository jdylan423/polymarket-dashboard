import React from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
          color: #e0e0e0;
          min-height: 100vh;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
