// GeoJSON Point type
export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  }
  
  // Photo metadata that comes from the upload form
  export interface PhotoMetadata {
    title: string;
    description: string;
    latitude?: number;
    longitude?: number;
    dateTaken?: string;
  }
  
  // The document as stored in MongoDB
  export interface PhotoDocument {
    _id?: string;
    url: string;
    originalName: string;
    uploadedAt: Date;
    latitude: number;
    longitude: number;
    auth0Id: string;
    username: string;
    caption: string;
    picture: string;
  }
  
  // API response when uploading a photo
  export interface PhotoUploadResponse {
    success: boolean;
    imageUrl?: string;
    message?: string;
    error?: string;
    details?: {
      code?: string;
      name?: string;
      metadata?: any;
    };
  }
  
  export interface PhotoDisplayData {
    id: string;
    url: string;
    title: string;
    description?: string;
    location: {
      lat: number;
      lng: number;
    };
    dateTaken: string;
    uploadedBy: {
      id: string;
      name: string;
      picture: string;
      website?: string;
      socialLinks?: {
        instagram?: string;
        strava?: string;
        facebook?: string;
      };
    };
  }