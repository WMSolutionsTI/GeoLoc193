import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude e longitude são obrigatórios" },
        { status: 400 }
      );
    }

    // Try Google Geocoding API if key is available and valid
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (googleApiKey && googleApiKey.length > 20 && !googleApiKey.includes("your-")) {
      try {
        const googleResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=pt-BR`
        );
        
        if (googleResponse.ok) {
          const data = await googleResponse.json();
          
          if (data.status === "OK" && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;
            
            let cidade = "";
            let logradouro = "";
            const plusCode = data.plus_code?.global_code || "";
            
            // Extract city
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cityComponent = addressComponents.find((comp: any) => 
              comp.types.includes("locality") || 
              comp.types.includes("administrative_area_level_2")
            );
            if (cityComponent) {
              cidade = cityComponent.long_name;
            }
            
            // Extract street address
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const streetNumber = addressComponents.find((comp: any) => 
              comp.types.includes("street_number")
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const route = addressComponents.find((comp: any) => 
              comp.types.includes("route")
            );
            if (route) {
              logradouro = route.long_name;
              if (streetNumber) {
                logradouro += `, ${streetNumber.long_name}`;
              }
            } else {
              logradouro = result.formatted_address;
            }
            
            return NextResponse.json({
              success: true,
              cidade,
              logradouro,
              plusCode,
              endereco: result.formatted_address,
              source: "google",
            });
          }
        }
      } catch (error) {
        console.error("Google Geocoding API error:", error);
        // Fall through to Nominatim
      }
    }
    
    // Fallback to OpenStreetMap Nominatim (free, no API key required)
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`,
        {
          headers: {
            "User-Agent": "GeoLoc193/1.0",
          },
        }
      );
      
      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();
        
        const cidade = data.address?.city || 
                      data.address?.town || 
                      data.address?.village || 
                      data.address?.municipality || "";
        
        const logradouro = data.address?.road || 
                          data.address?.pedestrian || 
                          data.address?.path || "";
        
        const endereco = data.display_name || "";
        
        // Generate Plus Code (simple approximation - not as accurate as Google's)
        // For production, consider using a proper Plus Code library
        const plusCode = await generatePlusCode(parseFloat(lat), parseFloat(lng));
        
        return NextResponse.json({
          success: true,
          cidade,
          logradouro,
          plusCode,
          endereco,
          source: "nominatim",
        });
      }
    } catch (error) {
      console.error("Nominatim geocoding error:", error);
    }
    
    return NextResponse.json(
      { error: "Não foi possível fazer geocodificação reversa" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer geocodificação" },
      { status: 500 }
    );
  }
}

// Simple Plus Code generation (approximation)
// For production, use a proper library like https://github.com/google/open-location-code
async function generatePlusCode(lat: number, lng: number): Promise<string> {
  try {
    // Try to use Google's Plus Code API if available
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey && googleApiKey.length > 20 && !googleApiKey.includes("your-")) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.plus_code?.global_code) {
          return data.plus_code.global_code;
        }
      }
    }
  } catch (error) {
    console.error("Error generating Plus Code:", error);
  }
  
  // Return empty string if not available
  return "";
}
