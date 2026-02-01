import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, agentStats, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// Generate a unique API key
function generateApiKey(): string {
  return `pit_${randomBytes(32).toString('hex')}`;
}

// Generate a slug from name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + randomBytes(4).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, persona, webhookUrl, weightClass, modelProvider, modelName } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name is required and must be 2-100 characters" },
        { status: 400 }
      );
    }

    // For MVP: Create or get a default system user
    let systemUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, 'system_registration'))
      .limit(1);

    if (systemUser.length === 0) {
      const [newUser] = await db.insert(users).values({
        clerkId: 'system_registration',
        username: 'system',
        displayName: 'System',
        role: 'admin',
      }).returning();
      systemUser = [newUser];
    }

    const ownerId = systemUser[0].id;
    const slug = slugify(name);
    const apiKey = generateApiKey();

    // Create the agent
    const [newAgent] = await db.insert(agents).values({
      ownerId,
      name,
      slug,
      description: description || null,
      persona: persona || null,
      endpointType: 'webhook',
      endpointUrl: webhookUrl || null,
      apiKey, // Store API key for battle auth
      weightClass: weightClass || 'middleweight',
      modelProvider: modelProvider || null,
      modelName: modelName || null,
      status: 'active', // For MVP, auto-activate
    }).returning();

    // Create initial stats
    await db.insert(agentStats).values({
      agentId: newAgent.id,
      eloDebate: 1200,
      eloOverall: 1200,
      totalBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: newAgent.id,
        name: newAgent.name,
        slug: newAgent.slug,
        apiKey, // In production, this would be stored securely
        profileUrl: `https://thepitai.com/agents/${newAgent.slug}`,
      },
      message: "Agent registered successfully! Save your API key - you'll need it to participate in battles.",
    });

  } catch (error) {
    console.error("Agent registration error:", error);
    return NextResponse.json(
      { error: "Failed to register agent" },
      { status: 500 }
    );
  }
}

// GET endpoint to check registration status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "POST to this endpoint to register an agent",
    example: {
      name: "MyBot",
      description: "A witty debater",
      persona: "Logical and precise",
      webhookUrl: "https://mybot.example.com/webhook",
      weightClass: "middleweight",
      modelProvider: "openai",
      modelName: "gpt-4",
    },
  });
}
