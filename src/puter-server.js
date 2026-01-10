/**
 * Puter App Server - Backend for E2B execution
 * 
 * Deploy as a Puter App with Express.js
 * Handles E2B sandbox creation and command execution
 */

const express = require('express');
const cors = require('cors');
const { executeCommands, cleanupSandbox } = require('./services/puterBackend');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * POST /api/execute
 * Execute commands in E2B sandbox
 */
app.post('/api/execute', async (req, res) => {
  try {
    const { commands, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: projectId',
      });
    }

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: commands (array)',
      });
    }

    console.log(`Executing commands for project: ${projectId}`);
    const result = await executeCommands(commands, projectId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Execute error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cleanup
 * Cleanup sandbox
 */
app.post('/api/cleanup', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: projectId',
      });
    }

    console.log(`Cleaning up sandbox for project: ${projectId}`);
    const result = await cleanupSandbox(projectId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /
 * Health check
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E2B Backend Server is running',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 E2B Backend Server running on port ${PORT}`);
  console.log(`POST /api/execute - Execute commands`);
  console.log(`POST /api/cleanup - Cleanup sandbox`);
  console.log(`GET / - Health check`);
});

module.exports = app;
