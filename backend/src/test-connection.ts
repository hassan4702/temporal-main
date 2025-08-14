import { Connection, Client } from '@temporalio/client';

async function testConnection() {
  try {
    console.log('Testing Temporal connection...');
    
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_HOST || 'localhost:7233',
      connectTimeout: 10000,
    });
    
    console.log('✅ Connected to Temporal server');
    
    const client = new Client({ 
      connection,
      namespace: 'default'
    });
    
    // Test starting a simple workflow
    const workflowId = `test-${Date.now()}`;
    console.log(`Starting test workflow: ${workflowId}`);
    
    const handle = await client.workflow.start('GetInventoryWorkflow', {
      taskQueue: 'order-task-queue',
      workflowId,
      args: [{}],
      workflowExecutionTimeout: '30 seconds',
    });
    
    console.log(`✅ Test workflow started: ${handle.workflowId}`);
    
    // Wait for result
    const result = await handle.result();
    console.log('✅ Test workflow completed:', result);
    
    await connection.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
