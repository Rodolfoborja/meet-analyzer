import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/settings - Get user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
        defaultLlmProvider: true,
        emailNotifications: true,
        timezone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mask API keys for security (show only last 4 chars)
    const maskKey = (key: string | null) => {
      if (!key) return "";
      if (key.length <= 8) return "••••••••";
      return "••••••••" + key.slice(-4);
    };

    return NextResponse.json({
      openaiApiKey: maskKey(user.openaiApiKey),
      anthropicApiKey: maskKey(user.anthropicApiKey),
      geminiApiKey: maskKey(user.geminiApiKey),
      defaultLlmProvider: user.defaultLlmProvider,
      emailNotifications: user.emailNotifications,
      timezone: user.timezone,
      // Indicate if keys are set
      hasOpenaiKey: !!user.openaiApiKey,
      hasAnthropicKey: !!user.anthropicApiKey,
      hasGeminiKey: !!user.geminiApiKey,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      defaultLlmProvider,
      emailNotifications,
      timezone,
    } = body;

    // Build update object, only including non-masked keys
    const updateData: any = {};

    // Only update API key if it's not masked (contains actual value)
    if (openaiApiKey && !openaiApiKey.startsWith("••••")) {
      updateData.openaiApiKey = openaiApiKey;
    }
    if (anthropicApiKey && !anthropicApiKey.startsWith("••••")) {
      updateData.anthropicApiKey = anthropicApiKey;
    }
    if (geminiApiKey && !geminiApiKey.startsWith("••••")) {
      updateData.geminiApiKey = geminiApiKey;
    }

    if (defaultLlmProvider) {
      updateData.defaultLlmProvider = defaultLlmProvider;
    }
    if (emailNotifications !== undefined) {
      updateData.emailNotifications = emailNotifications;
    }
    if (timezone) {
      updateData.timezone = timezone;
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        defaultLlmProvider: true,
        emailNotifications: true,
        timezone: true,
      },
    });

    return NextResponse.json({
      success: true,
      ...user,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
