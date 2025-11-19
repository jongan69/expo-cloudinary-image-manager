export interface Photo {
  url: string;
  description: string;
  tags: string[];
  width: number;
  height: number;
  public_id?: string;
  format?: string;
  created_at?: string;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

