import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/meetings - List user's meetings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [meetings, total] = await Promise.all([
      db.meeting.findMany({
        where,
        include: {
          participants: true,
          analysis: {
            select: {
              summary: true,
              keyPoints: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.meeting.count({ where }),
    ]);

    return NextResponse.json({
      meetings,
      total,
      hasMore: offset + meetings.length < total,
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/meetings - Create new meeting (for upload)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, platform, audioUrl, scheduledAt } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const meeting = await db.meeting.create({
      data: {
        userId: session.user.id,
        title,
        description,
        platform: platform || "UPLOAD",
        audioUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: audioUrl ? "PENDING" : "PENDING",
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
