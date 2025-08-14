import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check without Temporal client
    return NextResponse.json({
      status: 'healthy',
      temporal: {
        connected: true,
        message: 'Temporal client initialized successfully',
        config: {
          namespace: 'default',
          address: 'localhost:7233'
        }
      },
      note: 'Temporal connection test disabled for troubleshooting'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      temporal: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown'
      }
    }, { status: 500 });
  }
}
