import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const DEFAULT_BASE_URL = "https://profiletesting.staging.senpiper.com";
const API_PATH = "/api/core/form";

interface SubmitRequest {
  baseUrl?: string;
  groupId: string;
  companyId: string;
  authToken: string;
  schema: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { baseUrl, groupId, companyId, authToken, schema } = body;

    if (!groupId || !companyId || !authToken || !schema) {
      return NextResponse.json(
        { status: 400, message: "Missing required fields: groupId, companyId, authToken, or schema" },
        { status: 400 }
      );
    }

    const apiUrl = `${baseUrl || DEFAULT_BASE_URL}${API_PATH}`;

    // Merge groupId and companyId into the schema
    const payload = {
      ...schema,
      groupId,
      companyId,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        auth: authToken,
        lang: "English",
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      return NextResponse.json(jsonResponse, { status: response.status });
    } catch {
      // If not JSON, return as-is
      return new NextResponse(responseText, {
        status: response.status,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 500,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
