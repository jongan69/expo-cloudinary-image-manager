import { v2 as cloudinary } from 'cloudinary';

// Expo Router API route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId, description, tags, cloudName, apiKey, apiSecret } = body;

    if (!publicId || !cloudName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Configure Cloudinary with user's credentials
    if (apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    } else {
      return Response.json(
        { error: 'API credentials required for metadata updates' },
        { status: 401 }
      );
    }

    // Update context (description/caption)
    if (description) {
      const contextString = `caption=${encodeURIComponent(description)}|alt=${encodeURIComponent(description)}`;
      await cloudinary.uploader.add_context(contextString, [publicId]);
    }

    // Update tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await cloudinary.uploader.add_tag(tags, [publicId]);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return Response.json(
      { error: 'Failed to update metadata' },
      { status: 500 }
    );
  }
}

