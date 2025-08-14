import { Connection, Client } from '@temporalio/client';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const handle = await client.workflow.start('ProcessOrderWorkflow', {
    args: [{
      productId: 'Shirts',
      quantity: 3,
      customerId: 'cust-123',
      customerAddress: '123 Main Street'
    }],
    taskQueue: 'order-task-queue',
    workflowId: 'order-' + Date.now(),
  });

  console.log(`Workflow started: ${handle.workflowId}`);

  const result = await handle.result();
  console.log('Workflow result:', result);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
