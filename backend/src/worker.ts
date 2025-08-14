import { Worker } from '@temporalio/worker';

async function run() {
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempting to connect to Temporal (attempt ${retries + 1}/${maxRetries})...`);
      
      const worker = await Worker.create({
        workflowsPath: require.resolve('./workflows'),
        activities: require('./activities'),
        taskQueue: 'order-task-queue',
      });

      console.log("Worker started. Listening for workflows...");
      await worker.run();
      break; // Success, exit the retry loop
    } catch (err) {
      retries++;
      console.error(`Connection attempt ${retries} failed:`, err);
      
      if (retries >= maxRetries) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
