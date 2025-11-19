import { v2 as cloudinary } from 'cloudinary';

// Helper function to fetch photos from Cloudinary folder
async function getPhotosFromFolder(
  cloudinaryInstance: typeof cloudinary,
  folderName: string
) {
  try {
    console.log(`[API] Searching for images in folder: ${folderName}`);
    
    // Try different search expressions (similar to Netlify function)
    const expressions = [
      `folder:${folderName}/*`,
      `folder:${folderName}`,
      `resource_type:image AND folder:${folderName}/*`,
    ];
    
    let result = null;
    let lastError = null;
    
    for (const expression of expressions) {
      try {
        console.log(`[API] Trying expression: ${expression}`);
        result = await cloudinaryInstance.search
          .expression(expression)
          .sort_by('created_at', 'desc')
          .max_results(500)
          .with_field('context') // Ensure context is included in results
          .with_field('tags') // Ensure tags are included in results
          .execute();
        
        console.log(`[API] Found ${result.resources?.length || 0} resources with expression: ${expression}`);
        if (result.resources && result.resources.length > 0) {
          break;
        }
      } catch (err) {
        console.log(`[API] Expression ${expression} failed:`, err instanceof Error ? err.message : String(err));
        lastError = err;
        continue;
      }
    }
    
    if (!result || !result.resources || result.resources.length === 0) {
      console.warn('[API] No images found. Trying to list all resources...');
      // Try listing all resources to see what's available
      try {
        const allResources = await cloudinaryInstance.search
          .expression('resource_type:image')
          .max_results(10)
          .execute();
        console.log(`[API] Found ${allResources.resources?.length || 0} total images in account`);
        if (allResources.resources && allResources.resources.length > 0) {
          console.log('[API] Sample public_ids:', allResources.resources.slice(0, 3).map((r: any) => r.public_id));
        }
      } catch (listError) {
        console.error('[API] Failed to list resources:', listError);
      }
      
      if (lastError) {
        throw lastError;
      }
      return [];
    }

    // Process photos with enhanced metadata fetching (similar to Netlify function)
    const photos = await Promise.all(
      result.resources.map(async (resource: any) => {
        // First, try to get metadata from search result
        let description = resource.context?.caption || 
                         resource.context?.alt || 
                         resource.metadata?.caption ||
                         resource.metadata?.description ||
                         null;
        
        let tags = Array.isArray(resource.tags) ? resource.tags : [];
        
        // If search didn't return context/tags, fetch directly from Cloudinary API
        // This is more reliable than search API for recently saved metadata
        if (!description && !tags.length) {
          try {
            const directResource = await cloudinaryInstance.api.resource(resource.public_id, {
              context: true,
              tags: true
            });
            
            // Use direct API result if available
            if (directResource.context?.caption || directResource.context?.alt) {
              description = directResource.context.caption || directResource.context.alt;
            }
            if (Array.isArray(directResource.tags) && directResource.tags.length > 0) {
              tags = directResource.tags;
            }
          } catch (fetchError) {
            // If direct fetch fails, continue with search result (or null)
            console.warn(`[API] Could not fetch metadata directly for ${resource.public_id}:`, 
              fetchError instanceof Error ? fetchError.message : String(fetchError));
          }
        }
        
        // Decode URL-encoded descriptions (Cloudinary may return them encoded)
        if (description && typeof description === 'string') {
          try {
            description = decodeURIComponent(description);
          } catch (e) {
            // If decoding fails, use as-is
          }
        }
        
        // Also check context.tags if it exists (though add_tag stores in resource.tags)
        if (resource.context?.tags && typeof resource.context.tags === 'string') {
          const contextTags = resource.context.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
          tags = [...new Set([...tags, ...contextTags])]; // Merge and deduplicate
        }

        return {
          url: resource.secure_url,
          public_id: resource.public_id,
          description: description || 'Professional modeling photoshoot',
          tags: tags.length > 0 ? tags : [],
          width: resource.width,
          height: resource.height,
          format: resource.format,
          created_at: resource.created_at,
        };
      })
    );

    return photos;
  } catch (error) {
    console.error('[API] Error fetching photos from Cloudinary:', error);
    throw error;
  }
}

// Expo Router API route handler
export async function POST(request: Request) {
  console.log('[API] fetch-photos POST request received');
  console.log('[API] Request URL:', request.url);
  console.log('[API] Request method:', request.method);
  
  // Handle CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers,
    });
  }
  
  try {
    const body = await request.json();
    console.log('[API] Request body:', body);
    console.log('[API] Request body received:', {
      hasCloudName: !!body.cloudName,
      hasApiKey: !!body.apiKey,
      hasApiSecret: !!body.apiSecret,
      folder: body.folder,
    });
    
    const { cloudName, apiKey, apiSecret, folder } = body;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('[API] Missing required credentials:', {
        cloudName: !!cloudName,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
      });
      return Response.json(
        { error: 'Missing required credentials' },
        { status: 400, headers }
      );
    }

    // Configure Cloudinary with user's credentials from POST body
    console.log('[API] Configuring Cloudinary with cloudName:', cloudName);
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const folderName = folder || 'Modeling';
    console.log(`[API] Cloudinary config - cloud_name: ${cloudinary.config().cloud_name}`);
    
    const photos = await getPhotosFromFolder(cloudinary, folderName);
    
    console.log(`[API] Returning ${photos.length} photos`);
    
    return Response.json(
      { photos },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('[API] Error fetching photos:', error);
    if (error instanceof Error) {
      console.error('[API] Error message:', error.message);
      console.error('[API] Error stack:', error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { 
        error: 'Failed to fetch photos',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers }
    );
  }
}

