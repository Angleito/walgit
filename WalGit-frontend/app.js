const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WalGit - Decentralized Version Control</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          line-height: 1.6;
          color: #f0f0f0;
          background-color: #0b0b16;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        header {
          text-align: center;
          margin-bottom: 2rem;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          color: #05d9e8;
        }
        p.subtitle {
          font-size: 1.2rem;
          color: #a9a9c9;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .card {
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid #05d9e8;
          border-radius: 4px;
          padding: 1.5rem;
          box-shadow: 0 0 10px rgba(5, 217, 232, 0.3);
        }
        .card h2 {
          color: #05d9e8;
          margin-top: 0;
        }
        .btn {
          display: inline-block;
          background-color: #05d9e8;
          color: #0b0b16;
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          margin-right: 1rem;
          margin-top: 1rem;
        }
        .btn-alt {
          background-color: transparent;
          border: 1px solid #bf5af2;
          color: #bf5af2;
        }
        .actions {
          text-align: center;
          margin-top: 2rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>WalGit</h1>
          <p class="subtitle">Decentralized Version Control Powered by Blockchain</p>
        </header>
        
        <div class="card-grid">
          <div class="card">
            <h2>Decentralized Storage</h2>
            <p>Store your code securely across distributed networks with multi-tier optimization for different code components.</p>
          </div>
          
          <div class="card">
            <h2>Blockchain Security</h2>
            <p>Immutable commit history with cryptographic verification on the Sui blockchain for maximum code integrity.</p>
          </div>
          
          <div class="card">
            <h2>Modern Collaboration</h2>
            <p>Seamless code review process with built-in conflict resolution and parallel transaction handling.</p>
          </div>
        </div>
        
        <div class="actions">
          <a href="#" class="btn">Create Repository</a>
          <a href="#" class="btn btn-alt">Explore Projects</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Simple WalGit server running at http://localhost:${port}`);
});