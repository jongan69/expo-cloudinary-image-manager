import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId, cloudName, apiKey, apiSecret } = body;

    if (!publicId || !cloudName || !apiKey || !apiSecret) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return Response.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
