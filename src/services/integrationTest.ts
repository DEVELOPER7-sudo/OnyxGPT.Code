/**
 * Integration Test Suite
 * 
 * Comprehensive testing for CodeSandbox SDK + Puter integration
 */

import { codesandboxService } from './codesandboxService';
import { codesandboxPreviewService } from './codesandboxPreviewService';
import { puterE2BClient } from './puterApiClient';
import { autoWakeService } from './autoWakeService';
import type { Project } from '@/types/project';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  details?: any;
}

export class IntegrationTestSuite {
  private results: TestResult[] = [];

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting CodeSandbox + Puter Integration Tests');
    
    const tests = [
      this.testCodeSandboxService,
      this.testTerminalCreation,
      this.testFileOperations,
      this.testCommandExecution,
      this.testPreviewService,
      this.testPuterIntegration,
      this.testAutoWakeService,
      this.testErrorHandling,
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printResults();
    return this.results;
  }

  /**
   * Test CodeSandbox Service
   */
  private async testCodeSandboxService(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      // Test sandbox initialization
      await codesandboxService.initialize('test-project', {
        template: 'node',
        files: {
          'package.json': '{"name": "test", "version": "1.0.0"}',
          'index.js': 'console.log("Hello World");'
        }
      });

      const status = codesandboxService.getSandboxStatus('test-project');
      
      if (!status.isInitialized) {
        throw new Error('CodeSandbox service not initialized');
      }

      await codesandboxService.killSandbox('test-project');

      return {
        name: 'CodeSandbox Service',
        status: 'pass',
        duration: Date.now() - start,
        details: status,
      };
    } catch (error) {
      return {
        name: 'CodeSandbox Service',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Terminal Creation
   */
  private async testTerminalCreation(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      // Create a mock container
      const container = document.createElement('div');
      container.style.height = '400px';
      document.body.appendChild(container);

      await codesandboxService.initialize('test-terminal', {
        template: 'node',
      });

      const terminalId = await codesandboxService.createTerminal('test-terminal', container);
      
      if (!terminalId) {
        throw new Error('Failed to create terminal');
      }

      const terminals = codesandboxService.getTerminals('test-terminal');
      
      if (terminals.length === 0) {
        throw new Error('Terminal not found in list');
      }

      await codesandboxService.killTerminal('test-terminal', terminalId);
      await codesandboxService.killSandbox('test-terminal');
      container.remove();

      return {
        name: 'Terminal Creation',
        status: 'pass',
        duration: Date.now() - start,
        details: { terminalId, terminalCount: terminals.length },
      };
    } catch (error) {
      return {
        name: 'Terminal Creation',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test File Operations
   */
  private async testFileOperations(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      await codesandboxService.initialize('test-files', {
        template: 'node',
      });

      // Test file writing
      await codesandboxService.writeFiles('test-files', {
        'test.txt': 'Hello World',
        'package.json': '{"name": "test"}',
      });

      // Test file reading
      const content = await codesandboxService.readFile('test-files', 'test.txt');
      
      if (content !== 'Hello World') {
        throw new Error('File content mismatch');
      }

      // Test file listing
      const files = await codesandboxService.listFiles('test-files', '/');
      
      if (!files.includes('test.txt') || !files.includes('package.json')) {
        throw new Error('Files not found in listing');
      }

      await codesandboxService.killSandbox('test-files');

      return {
        name: 'File Operations',
        status: 'pass',
        duration: Date.now() - start,
        details: { files, content },
      };
    } catch (error) {
      return {
        name: 'File Operations',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Command Execution
   */
  private async testCommandExecution(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      await codesandboxService.initialize('test-commands', {
        template: 'node',
      });

      // Test simple command
      const output = await codesandboxService.executeCommand('test-commands', 'echo "Hello World"');
      
      if (!output.includes('Hello World')) {
        throw new Error('Command output mismatch');
      }

      // Test file system command
      await codesandboxService.executeCommand('test-commands', 'mkdir test-dir');
      const files = await codesandboxService.listFiles('test-commands', '/');
      
      if (!files.includes('test-dir')) {
        throw new Error('Directory not created');
      }

      await codesandboxService.killSandbox('test-commands');

      return {
        name: 'Command Execution',
        status: 'pass',
        duration: Date.now() - start,
        details: { output, files },
      };
    } catch (error) {
      return {
        name: 'Command Execution',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Preview Service
   */
  private async testPreviewService(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      const mockProject: Project = {
        id: 'test-preview',
        name: 'Test Project',
        fileTree: {
          type: 'directory',
          name: 'root',
          children: [
            {
              type: 'file',
              name: 'package.json',
              content: '{"name": "test", "scripts": {"dev": "echo \\"Server running\\""}}',
            },
            {
              type: 'file',
              name: 'index.js',
              content: 'console.log("Hello World");',
            },
          ],
        },
      };

      const session = await codesandboxPreviewService.startDevServer(mockProject, {
        port: 3000,
      });

      if (session.status !== 'running') {
        throw new Error('Preview server failed to start');
      }

      const health = await codesandboxPreviewService.checkPreviewHealth('test-preview');
      
      if (!health) {
        throw new Error('Preview health check failed');
      }

      await codesandboxPreviewService.stopDevServer('test-preview');

      return {
        name: 'Preview Service',
        status: 'pass',
        duration: Date.now() - start,
        details: { session, health },
      };
    } catch (error) {
      return {
        name: 'Preview Service',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Puter Integration
   */
  private async testPuterIntegration(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      // Test Puter availability
      if (!window.puter) {
        return {
          name: 'Puter Integration',
          status: 'skip',
          duration: Date.now() - start,
          details: 'Puter not available in test environment',
        };
      }

      // Test basic Puter operations
      const testKey = 'test-integration-key';
      const testValue = 'test-value';
      
      await window.puter.kv.set(testKey, testValue);
      const retrieved = await window.puter.kv.get(testKey);
      
      if (retrieved !== testValue) {
        throw new Error('Puter KV storage failed');
      }

      await window.puter.kv.delete(testKey);

      return {
        name: 'Puter Integration',
        status: 'pass',
        duration: Date.now() - start,
        details: { testKey, testValue },
      };
    } catch (error) {
      return {
        name: 'Puter Integration',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Auto-Wake Service
   */
  private async testAutoWakeService(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      const preview: any = {
        projectId: 'test-autowake',
        previewUrl: 'https://test.example.com',
        sandboxId: 'test-sandbox',
        port: 3000,
        lastAccessed: Date.now() - 5000, // 5 seconds ago
        isActive: false,
        autoWakeEnabled: true,
      };

      autoWakeService.registerPreview(preview);
      
      const registered = autoWakeService.getPreview('test-autowake');
      
      if (!registered) {
        throw new Error('Preview not registered');
      }

      autoWakeService.updatePreviewAccess('test-autowake');
      autoWakeService.unregisterPreview('test-autowake');

      return {
        name: 'Auto-Wake Service',
        status: 'pass',
        duration: Date.now() - start,
        details: { preview },
      };
    } catch (error) {
      return {
        name: 'Auto-Wake Service',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Error Handling
   */
  private async testErrorHandling(): Promise<TestResult> {
    const start = Date.now();
    
    try {
      // Test invalid project ID
      try {
        await codesandboxService.executeCommand('nonexistent', 'echo test');
        throw new Error('Should have thrown error for nonexistent project');
      } catch (error) {
        if (!error || !error.toString().includes('not initialized')) {
          throw new Error('Wrong error type');
        }
      }

      // Test invalid file path
      try {
        await codesandboxService.readFile('test-error', '/nonexistent/file.txt');
        throw new Error('Should have thrown error for nonexistent file');
      } catch (error) {
        if (!error || !error.toString().includes('not initialized')) {
          throw new Error('Wrong error type');
        }
      }

      return {
        name: 'Error Handling',
        status: 'pass',
        duration: Date.now() - start,
        details: 'All error cases handled correctly',
      };
    } catch (error) {
      return {
        name: 'Error Handling',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run individual test
   */
  private async runTest(test: () => Promise<TestResult>): Promise<void> {
    try {
      const result = await test();
      this.results.push(result);
      
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${result.name} - ${result.status.toUpperCase()} (${result.duration}ms)`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      this.results.push({
        name: 'Unknown Test',
        status: 'fail',
        duration: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    console.log('\n📊 Test Results Summary');
    console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }

    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    console.log(`\n📈 Success Rate: ${successRate}%`);
  }

  /**
   * Cleanup after tests
   */
  async cleanup(): Promise<void> {
    await codesandboxService.cleanup();
    autoWakeService.cleanup();
    this.results = [];
  }
}

// Export singleton instance
export const integrationTestSuite = new IntegrationTestSuite();

// Auto-run tests in development
// Auto-run tests in development (commented out to avoid issues)
// if (process.env.NODE_ENV === 'development') {
//   (async () => {
//     try {
//       await integrationTestSuite.runAllTests();
//     } catch (error) {
//       console.error('Integration tests failed:', error);
//     }
//   })();
// }