import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // Search using Unsplash API (free tier - 50 requests/hour)
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (unsplashKey) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + " food")}&per_page=6&orientation=squarish`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.results.map((img: any) => ({
          id: img.id,
          url: img.urls.regular,
          thumb: img.urls.thumb,
          alt: img.alt_description || query,
          credit: img.user.name,
        }));
        return NextResponse.json({ success: true, images, source: "unsplash" });
      }
    }

    // Fallback: Use Pexels API
    const pexelsKey = process.env.PEXELS_API_KEY;
    
    if (pexelsKey) {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=6&orientation=square`,
        {
          headers: {
            Authorization: pexelsKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.photos.map((img: any) => ({
          id: img.id,
          url: img.src.large,
          thumb: img.src.tiny,
          alt: img.alt || query,
          credit: img.photographer,
        }));
        return NextResponse.json({ success: true, images, source: "pexels" });
      }
    }

    // Fallback: Use free image sources (no API key needed)
    // Using Lorem Picsum and foodish for food images
    const fallbackImages = [
      {
        id: "1",
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(query)},food`,
        thumb: `https://source.unsplash.com/100x100/?${encodeURIComponent(query)},food`,
        alt: query,
        credit: "Unsplash",
      },
      {
        id: "2", 
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(query)},meal`,
        thumb: `https://source.unsplash.com/100x100/?${encodeURIComponent(query)},meal`,
        alt: query,
        credit: "Unsplash",
      },
      {
        id: "3",
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(query)},dish`,
        thumb: `https://source.unsplash.com/100x100/?${encodeURIComponent(query)},dish`,
        alt: query,
        credit: "Unsplash",
      },
    ];

    return NextResponse.json({ success: true, images: fallbackImages, source: "fallback" });

  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search images" },
      { status: 500 }
    );
  }
}
