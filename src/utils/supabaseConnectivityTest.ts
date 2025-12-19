/**
 * Supabase Connectivity Test Utility
 * Comprehensive network and API tests for debugging connection issues
 */

export interface ConnectivityTestResult {
  test: string;
  status: 'success' | 'failed' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export class SupabaseConnectivityTester {
  private projectId = 'okgeyuhmumlkkcpoholh';
  private baseUrl = `https://${this.projectId}.supabase.co`;
  private anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDAyMjAsImV4cCI6MjA3Mzk3NjIyMH0.wICqJoMc9a2-S7OwW6VMwcs1-ApPjpnS2QMZ4BVZFpI';
  
  private results: ConnectivityTestResult[] = [];

  /**
   * Test 1: Basic DNS Resolution
   */
  async testDNS(): Promise<ConnectivityTestResult> {
    const test = 'DNS Resolution';
    const timestamp = new Date().toISOString();
    
    try {
      const response = await fetch(this.baseUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Bypass CORS for DNS test
      });
      
      return {
        test,
        status: 'success',
        message: `✅ DNS resolved: ${this.baseUrl}`,
        details: { url: this.baseUrl },
        timestamp
      };
    } catch (error: any) {
      return {
        test,
        status: 'failed',
        message: `❌ DNS resolution failed: ${error.message}`,
        details: { 
          error: error.message,
          type: error.name,
          url: this.baseUrl
        },
        timestamp
      };
    }
  }

  /**
   * Test 2: Supabase REST API Endpoint
   */
  async testRESTAPI(): Promise<ConnectivityTestResult> {
    const test = 'REST API Endpoint';
    const timestamp = new Date().toISOString();
    const url = `${this.baseUrl}/rest/v1/`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });

      if (response.ok) {
        return {
          test,
          status: 'success',
          message: `✅ REST API accessible (${response.status})`,
          details: { 
            status: response.status,
            statusText: response.statusText,
            url 
          },
          timestamp
        };
      } else {
        return {
          test,
          status: 'warning',
          message: `⚠️ REST API responded with ${response.status}`,
          details: { 
            status: response.status,
            statusText: response.statusText,
            url 
          },
          timestamp
        };
      }
    } catch (error: any) {
      return {
        test,
        status: 'failed',
        message: `❌ REST API unreachable: ${error.message}`,
        details: { 
          error: error.message,
          type: error.name,
          url 
        },
        timestamp
      };
    }
  }

  /**
   * Test 3: Specific Table Access (customers)
   */
  async testTableAccess(): Promise<ConnectivityTestResult> {
    const test = 'Table Access (customers)';
    const timestamp = new Date().toISOString();
    const url = `${this.baseUrl}/rest/v1/customers?select=id&limit=1`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          test,
          status: 'success',
          message: `✅ Table accessible (found ${Array.isArray(data) ? data.length : 0} records)`,
          details: { 
            status: response.status,
            recordCount: Array.isArray(data) ? data.length : 0,
            url 
          },
          timestamp
        };
      } else {
        const errorText = await response.text();
        return {
          test,
          status: 'failed',
          message: `❌ Table access failed (${response.status})`,
          details: { 
            status: response.status,
            error: errorText,
            url 
          },
          timestamp
        };
      }
    } catch (error: any) {
      return {
        test,
        status: 'failed',
        message: `❌ Table query failed: ${error.message}`,
        details: { 
          error: error.message,
          type: error.name,
          url 
        },
        timestamp
      };
    }
  }

  /**
   * Test 4: WebSocket/Realtime Connection
   */
  async testRealtimeConnection(): Promise<ConnectivityTestResult> {
    const test = 'Realtime WebSocket';
    const timestamp = new Date().toISOString();
    const wsUrl = `wss://${this.projectId}.supabase.co/realtime/v1/websocket?apikey=${this.anonKey}&vsn=1.0.0`;
    
    try {
      // Simple WebSocket connection test
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          ws.close();
          resolve({
            test,
            status: 'warning',
            message: '⚠️ WebSocket connection timeout (5s)',
            details: { url: wsUrl },
            timestamp
          });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            test,
            status: 'success',
            message: '✅ WebSocket connection successful',
            details: { url: wsUrl },
            timestamp
          });
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          resolve({
            test,
            status: 'failed',
            message: '❌ WebSocket connection failed',
            details: { 
              error: error.toString(),
              url: wsUrl 
            },
            timestamp
          });
        };
      });
    } catch (error: any) {
      return {
        test,
        status: 'failed',
        message: `❌ WebSocket test error: ${error.message}`,
        details: { 
          error: error.message,
          url: wsUrl 
        },
        timestamp
      };
    }
  }

  /**
   * Test 5: CORS Configuration
   */
  async testCORS(): Promise<ConnectivityTestResult> {
    const test = 'CORS Configuration';
    const timestamp = new Date().toISOString();
    const url = `${this.baseUrl}/rest/v1/`;
    
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'apikey,authorization'
        }
      });

      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers')
      };

      if (response.ok || response.status === 204) {
        return {
          test,
          status: 'success',
          message: '✅ CORS configured correctly',
          details: { 
            status: response.status,
            headers: corsHeaders 
          },
          timestamp
        };
      } else {
        return {
          test,
          status: 'warning',
          message: `⚠️ CORS preflight returned ${response.status}`,
          details: { 
            status: response.status,
            headers: corsHeaders 
          },
          timestamp
        };
      }
    } catch (error: any) {
      return {
        test,
        status: 'failed',
        message: `❌ CORS test failed: ${error.message}`,
        details: { 
          error: error.message 
        },
        timestamp
      };
    }
  }

  /**
   * Test 6: Network Speed
   */
  async testNetworkSpeed(): Promise<ConnectivityTestResult> {
    const test = 'Network Speed';
    const timestamp = new Date().toISOString();
    const url = `${this.baseUrl}/rest/v1/customers?select=id&limit=1`;
    
    try {
      const startTime = performance.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      let status: 'success' | 'warning' | 'failed' = 'success';
      let message = `✅ Latency: ${latency}ms`;

      if (latency > 1000) {
        status = 'warning';
        message = `⚠️ Slow connection: ${latency}ms`;
      } else if (latency > 3000) {
        status = 'failed';
        message = `❌ Very slow connection: ${latency}ms`;
      }

      return {
        test,
        status,
        message,
        details: { 
          latencyMs: latency,
          responseStatus: response.status 
        },
        timestamp
      };
    } catch (error: any) {
      return {
        test,
        status: 'failed',
        message: `❌ Network speed test failed: ${error.message}`,
        details: { 
          error: error.message 
        },
        timestamp
      };
    }
  }

  /**
   * Run all tests sequentially
   */
  async runAllTests(): Promise<ConnectivityTestResult[]> {
    console.log('🚀 Starting Supabase Connectivity Tests...\n');
    
    this.results = [];

    // Test 1: DNS
    const dnsResult = await this.testDNS();
    this.results.push(dnsResult);
    console.log(`${dnsResult.status === 'success' ? '✅' : '❌'} ${dnsResult.test}: ${dnsResult.message}`);

    // Test 2: REST API
    const restResult = await this.testRESTAPI();
    this.results.push(restResult);
    console.log(`${restResult.status === 'success' ? '✅' : '❌'} ${restResult.test}: ${restResult.message}`);

    // Test 3: Table Access
    const tableResult = await this.testTableAccess();
    this.results.push(tableResult);
    console.log(`${tableResult.status === 'success' ? '✅' : '❌'} ${tableResult.test}: ${tableResult.message}`);

    // Test 4: WebSocket
    const wsResult = await this.testRealtimeConnection();
    this.results.push(wsResult);
    console.log(`${wsResult.status === 'success' ? '✅' : '❌'} ${wsResult.test}: ${wsResult.message}`);

    // Test 5: CORS
    const corsResult = await this.testCORS();
    this.results.push(corsResult);
    console.log(`${corsResult.status === 'success' ? '✅' : '❌'} ${corsResult.test}: ${corsResult.message}`);

    // Test 6: Network Speed
    const speedResult = await this.testNetworkSpeed();
    this.results.push(speedResult);
    console.log(`${speedResult.status === 'success' ? '✅' : '⚠️'} ${speedResult.test}: ${speedResult.message}`);

    // Summary
    const successCount = this.results.filter(r => r.status === 'success').length;
    const failedCount = this.results.filter(r => r.status === 'failed').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Warning: ${warningCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log('\n🔍 Full results available in return value');

    return this.results;
  }

  /**
   * Get formatted report
   */
  getReport(): string {
    if (this.results.length === 0) {
      return 'No tests run yet. Call runAllTests() first.';
    }

    let report = '═══════════════════════════════════════════════\n';
    report += '  SUPABASE CONNECTIVITY TEST REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';

    this.results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      report += `${index + 1}. ${icon} ${result.test}\n`;
      report += `   ${result.message}\n`;
      if (result.details) {
        report += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      report += `   Time: ${result.timestamp}\n\n`;
    });

    const successCount = this.results.filter(r => r.status === 'success').length;
    const total = this.results.length;
    report += `───────────────────────────────────────────────\n`;
    report += `SCORE: ${successCount}/${total} tests passed\n`;
    report += `═══════════════════════════════════════════════\n`;

    return report;
  }
}

/**
 * Quick test function for console
 */
export async function quickSupabaseTest() {
  const tester = new SupabaseConnectivityTester();
  await tester.runAllTests();
  console.log('\n' + tester.getReport());
  return tester.results;
}
