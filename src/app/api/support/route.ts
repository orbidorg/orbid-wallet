import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

// Create Redis client for tickets
const getRedis = () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return null;
    return new Redis(redisUrl, { maxRetriesPerRequest: 3 });
};

const redis = getRedis();

export interface SupportTicket {
    id: string;
    email: string;
    topic: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved' | 'closed';
    walletAddress?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}

const TICKETS_KEY = 'support:tickets';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/** Generate unique ticket ID */
function generateTicketId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TKT-${timestamp}-${random}`.toUpperCase();
}

/** POST - Create new support ticket */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, topic, message, walletAddress } = body;

        if (!email || !topic || !message) {
            return NextResponse.json(
                { error: 'Email, topic, and message are required' },
                { status: 400 }
            );
        }

        const ticket: SupportTicket = {
            id: generateTicketId(),
            email,
            topic,
            message,
            status: 'new',
            walletAddress: walletAddress || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Save to Redis hash
        if (!redis) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
        }
        await redis.hset(TICKETS_KEY, ticket.id, JSON.stringify(ticket));

        return NextResponse.json({
            success: true,
            ticketId: ticket.id,
            message: 'Ticket created successfully'
        });
    } catch (error) {
        console.error('Failed to create ticket:', error);
        return NextResponse.json(
            { error: 'Failed to create ticket' },
            { status: 500 }
        );
    }
}

/** GET - List all tickets (admin only) */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!redis) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
        }
        const ticketsData = await redis.hgetall(TICKETS_KEY);

        if (!ticketsData || Object.keys(ticketsData).length === 0) {
            return NextResponse.json({ tickets: [] });
        }

        const tickets: SupportTicket[] = Object.values(ticketsData)
            .map(t => JSON.parse(t as string))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tickets' },
            { status: 500 }
        );
    }
}

/** PATCH - Update ticket status (admin only) */
export async function PATCH(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ticketId, status } = await request.json();

        if (!ticketId || !status) {
            return NextResponse.json(
                { error: 'Ticket ID and status are required' },
                { status: 400 }
            );
        }

        const validStatuses = ['new', 'in-progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        if (!redis) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
        }

        const ticketData = await redis.hget(TICKETS_KEY, ticketId);
        if (!ticketData) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            );
        }

        const ticket: SupportTicket = JSON.parse(ticketData as string);
        ticket.status = status;
        ticket.updatedAt = new Date().toISOString();

        if (status === 'resolved' || status === 'closed') {
            ticket.resolvedAt = new Date().toISOString();
        }

        await redis.hset(TICKETS_KEY, ticketId, JSON.stringify(ticket));

        return NextResponse.json({
            success: true,
            ticket
        });
    } catch (error) {
        console.error('Failed to update ticket:', error);
        return NextResponse.json(
            { error: 'Failed to update ticket' },
            { status: 500 }
        );
    }
}

/** DELETE - Delete ticket (admin only) */
export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const ticketId = searchParams.get('id');

        if (!ticketId) {
            return NextResponse.json(
                { error: 'Ticket ID is required' },
                { status: 400 }
            );
        }

        if (!redis) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
        }

        await redis.hdel(TICKETS_KEY, ticketId);

        return NextResponse.json({
            success: true,
            message: 'Ticket deleted'
        });
    } catch (error) {
        console.error('Failed to delete ticket:', error);
        return NextResponse.json(
            { error: 'Failed to delete ticket' },
            { status: 500 }
        );
    }
}
