import { supabase } from './supabaseClient';

const API_BASE = 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
}

interface RegisterResponse {
  msg: string;
}

interface LoginResponse {
  access_token: string;
  role: string;
  username: string;
  user_id: number;
  profile_completed?: boolean;
  msg?: string;
}

interface ErrorResponse {
  msg: string;
}

export interface Campaign {
  id: number;
  name: string;
  platform: string;
  budget: number;       // The "Target" budget (Promise)
  funds_allocated: number;
  cpv: number;
  hashtag: string | null;
  audio: string | null;
  deadline: string;
  requirements: string | null;
  brand_id: number;
  is_active: boolean;
  total_view_count: number;
  view_threshold: number;
  category: string;  // Changed from specific union type to string
  asset_link: string;
  image_url: string;
  submitted_clips?: SubmittedClipData[]; // Changed from ClipData[]
  accepted_clips?: Array<{
    id: number;
    campaign_id: number;
    creator_id: number;
    creator_name: string;
    clip_url: string;
    media_id?: string;
    view_count: number;
    caption?: string;
    instagram_posted_at?: string;
    submitted_at: string;
  }>;
  creator_rankings?: Array<{
    creator_id: number;
    creator_name: string;
    total_views: number;
    clip_count: number;
  }>;
}

export interface WalletBalanceResponse {
  role: string;
  balance: number;
  currency: string;
}

export async function uploadCampaignImage(file: File): Promise<string> {
  try {
    // 1. Generate a unique file path (prevent overwrites)
    // Structure: brand_id_timestamp_filename
    // Note: We use a random string or timestamp to ensure uniqueness
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `campaign_covers/${fileName}`;

    // 2. Upload to Supabase Storage
    // We upload to the 'campaign-images' bucket we created in SQL
    const { error: uploadError } = await supabase.storage
      .from('campaign-images')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    // 3. Get the Public URL
    // This is the string we will send to your Flask Backend
    const { data } = supabase.storage
      .from('campaign-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
    
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

export async function deleteCampaignImage(fullUrl: string): Promise<void> {
  try {
    // Extract the file path from the full URL
    // URL format: .../storage/v1/object/public/campaign-images/campaign_covers/filename.webp
    // We need: campaign_covers/filename.webp
    const path = fullUrl.split('/campaign-images/')[1];
    
    if (!path) {
      console.warn("Could not extract path from URL, skipping delete:", fullUrl);
      return;
    }

    const { error } = await supabase.storage
      .from('campaign-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting old image:', error);
      // We log but don't throw, because failing to delete shouldn't crash the app
    }
  } catch (error) {
    console.error('Error in deleteCampaignImage:', error);
  }
}

export async function updateCampaignImage(id: number, payload: { image_url: string }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}/image`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign image');
  return data;
}

export interface ClipData { // New interface to combine submitted and accepted clip data
  id: number;
  campaign_id: number;
  creator_id: number;
  clip_url: string;
  submitted_at: string;
  status: 'in_review' | 'accepted' | 'rejected'; // Inferred status
  is_deleted_by_admin?: boolean; // Only for submitted clips (rejected by admin)
  feedback?: string; // Only for submitted clips (rejection feedback)
  media_id?: string; // Only for accepted clips
  view_count?: number; // Only for accepted clips
  caption?: string; // Only for accepted clips
  instagram_posted_at?: string; // Only for accepted clips
  // Removed accepted_date?: string; // Made optional for ClipData
}

export interface SubmittedClipData {
  id: number;
  campaign_id: number;
  creator_id: number;
  clip_url: string;
  submitted_at: string; // Corresponds to submission_date in SQL
  status: string;
  is_deleted_by_admin?: boolean;
  feedback?: string;
  view_count?: number; // Added as per app.py's expectation for this object
}

export interface AcceptedClipData {
  id: number;
  campaign_id: number;
  creator_id: number;
  clip_url: string;
  submitted_at: string; // Corresponds to submitted_at in SQL
  media_id?: string;
  view_count?: number;
  caption?: string;
  instagram_posted_at?: string;
  // removed accepted_date as it's now in ClipData
}

export interface CreatorProfile {
  username: string;
  email: string;
  nickname?: string;
  bio?: string;
  phone?: string; // Changed from phone_number to phone
  join_date?: string; // Added join_date
  profile_completed: boolean;
  msg?: string;
}

interface CreateCampaignResponse {
  msg: string;
  campaign_id: number;
}

interface SubmitClipResponse {
  msg: string;
  clip_id: number;
}

interface DeleteResponse {
  msg: string;
}

interface UpdateClipResponse {
  msg: string;
}

export async function register({ email, password, role, username }: { email: string, password: string, role: string, username: string }): Promise<RegisterResponse> {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, role, username })
    });
    const data: RegisterResponse = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Registration failed');
    return data;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

export async function login({ email, password, role }: { email: string, password: string, role: string }): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (!res.ok) {
      const errorData: ErrorResponse = data;
      throw new Error(errorData.msg || 'Login failed');
    }
    return data as LoginResponse;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'is_active' | 'total_view_count' | 'submitted_clips' | 'accepted_clips'> & { asset_link?: string }): Promise<CreateCampaignResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(campaign)
  });
  const data: CreateCampaignResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to create campaign');
  return data;
}

export async function fetchBrandCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function fetchAllCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/api/campaigns`);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function fetchCampaignById(id: number): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/api/campaigns/${id}`);
  if (!res.ok) throw new Error('Failed to fetch campaign');
  return res.json();
}

export async function fetchCreatorCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetch(`${API_BASE}/api/creator/your-campaigns`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errorData: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(errorData.msg || 'Failed to fetch your campaigns');
    }

    let campaigns: Campaign[] = await res.json();

    // Normalise data coming from backend for frontend expectations
    campaigns = campaigns.map((campaign: any) => {
      // Provide default category if missing
      if (!campaign.category) {
        campaign.category = 'fashion_clothing';
      }

      // Convert backend 'pending' status to frontend 'in_review'
      if (Array.isArray(campaign.submitted_clips)) {
        campaign.submitted_clips = campaign.submitted_clips.map((clip: any) => ({
          ...clip,
          status: clip.status === 'pending' ? 'in_review' : clip.status
        }));
      }

      return campaign;
    });

    return campaigns;
  } catch (error) {
    console.error('Error in fetchCreatorCampaigns:', error);
    throw error;
  }
}

export async function submitClip(data: { campaign_id: number, clip_url: string }): Promise<SubmitClipResponse> {
  const res = await fetch(`${API_BASE}/api/creator/submit-clip`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result: SubmitClipResponse = await res.json();
  if (!res.ok) throw new Error(result.msg || 'Failed to submit clip');
  return result;
}

export async function fetchCreatorClipsForCampaign(campaign_id: number): Promise<ClipData[]> {
  const res = await fetch(`${API_BASE}/api/creator/campaign-clips?campaign_id=${campaign_id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch submitted clips');
  return res.json();
}

export async function deleteCampaign(id: number): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  // If the campaign was already deleted (404), that's fine - it's already gone
  if (res.status === 404) {
    return { msg: 'Campaign already deleted or not found' };
  }
  
  // For all other error statuses, handle them as before
  if (!res.ok) {
    let errorMsg = 'Failed to delete campaign';
    try {
      const data = await res.json();
      errorMsg = data.msg || errorMsg;
    } catch (e) {
      // If we can't parse the error as JSON, use the status text
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  
  // If we get here, the deletion was successful
  return { msg: 'Campaign deleted successfully' };
}

export async function deleteClip(id: number): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE}/api/creator/clip/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data: DeleteResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to delete clip');
  return data;
}

export async function deleteClipAdmin(id: number): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE}/api/admin/clip/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data: DeleteResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to delete clip');
  return data;
}

export async function updateCampaignBudget(id: number, payload: { budget: number }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}/budget`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign budget');
  return data;
}

export async function updateCampaignRequirements(id: number, payload: { requirements: string }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}/requirements`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign requirements');
  return data;
}

export async function updateCampaignStatus(id: number, payload: { is_active: boolean }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign status');
  return data;
}

export async function updateCampaignViewThreshold(id: number, payload: { view_threshold: number }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}/view_threshold`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign view threshold');
  return data;
}

export async function updateCampaignDeadline(id: number, payload: { deadline: string }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${id}/deadline`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign deadline');
  return data;
}

export async function fetchAdminCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/api/admin/campaigns`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch admin campaigns');
  return res.json();
}

export async function adminUpdateClip(id: number, payload: { status: string; feedback?: string }): Promise<UpdateClipResponse> {
  const res = await fetch(`${API_BASE}/api/admin/clip/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data: UpdateClipResponse = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update clip');
  return data;
}

export async function fetchCreatorProfile(): Promise<CreatorProfile> {
  try {
    const res = await fetch(`${API_BASE}/api/creator/profile`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      const errorData: ErrorResponse = data;
      throw new Error(errorData.msg || 'Failed to fetch creator profile');
    }
    return data as CreatorProfile;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

export async function updateCreatorProfile(profileData: { nickname?: string; bio?: string; phone?: string }): Promise<UpdateClipResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/creator/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data: UpdateClipResponse = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to update profile');
    return data;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

// --- PAYMENT ENDPOINTS ---

export interface CashfreeOrderResponse {
  payment_session_id: string;
  order_id: string;
}

export interface VirtualAccountResponse {
  account_number: string;
  ifsc: string;
  vpa_id: string;
}

export async function createDepositOrder(amount: number): Promise<CashfreeOrderResponse> {
  const res = await fetch(`${API_BASE}/api/payments/create-deposit-order`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to create deposit order');
  return data;
}

export async function verifyDeposit(orderId: string): Promise<{ msg: string; new_balance: number }> {
  const res = await fetch(`${API_BASE}/api/payments/verify-deposit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ order_id: orderId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Payment verification failed');
  return data;
}

export async function getVirtualAccount(): Promise<VirtualAccountResponse> {
  const res = await fetch(`${API_BASE}/api/payments/virtual-account`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch virtual account');
  return data;
}



// 3. ADD New Functions
export async function getWalletBalance(): Promise<WalletBalanceResponse> {
  const res = await fetch(`${API_BASE}/api/payments/wallet-balance`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch wallet balance');
  return res.json();
}

export async function allocateBudget(campaignId: number, amount: number): Promise<{ msg: string }> {
  const res = await fetch(`${API_BASE}/api/payments/allocate-budget`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ campaign_id: campaignId, amount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Allocation failed');
  return data;
}

export async function reclaimBudget(campaignId: number, amount: number): Promise<{ msg: string }> {
  const res = await fetch(`${API_BASE}/api/payments/reclaim-budget`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ campaign_id: campaignId, amount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Reclaim failed');
  return data;
}