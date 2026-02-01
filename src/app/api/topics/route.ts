import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { debateTopics } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') !== 'false';

    let query = db.select().from(debateTopics);

    if (activeOnly) {
      query = query.where(eq(debateTopics.isActive, true)) as any;
    }

    const topics = await query;

    // Filter by category if specified
    const filteredTopics = category
      ? topics.filter(t => t.category === category)
      : topics;

    // Get unique categories
    const categories = [...new Set(topics.map(t => t.category).filter(Boolean))];

    return NextResponse.json({
      topics: filteredTopics,
      categories,
      total: filteredTopics.length,
    });
  } catch (error) {
    console.error("List topics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

// Add a new topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, category, positionA, positionB, difficulty } = body;

    if (!topic || typeof topic !== 'string' || topic.length < 10) {
      return NextResponse.json(
        { error: "Topic is required and must be at least 10 characters" },
        { status: 400 }
      );
    }

    const [newTopic] = await db.insert(debateTopics).values({
      topic,
      category: category || null,
      positionA: positionA || 'Affirmative',
      positionB: positionB || 'Negative',
      difficulty: difficulty || 'medium',
      isActive: true,
    }).returning();

    return NextResponse.json({
      success: true,
      topic: newTopic,
    });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
