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
    userId: string;
    url: string;
    title: string;
    description: string;
    location: GeoPoint | null;
    dateTaken: Date | null;
    uploadedAt: Date;
    filename: string;
    status: 'active' | 'deleted' | 'pending';
    exifData?: {
      make?: string;
      model?: string;
      exposureTime?: string;
      fNumber?: number;
      iso?: number;
      focalLength?: string;
    };
    tags?: string[];
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
  
  // Photo data as used in the frontend
  export interface PhotoDisplayData {
    id: string;
    url: string;
    title: string;
    description: string;
    location?: {
      lat: number;
      lng: number;
    };
    dateTaken?: Date;
    uploadedBy: {
        id: string;
        name: string;
        picture: string;
        socials?: {
          instagram?: string;
          strava?: string;
          // add other socials as needed
        };
      };
    
    
    tags: string[];
  }