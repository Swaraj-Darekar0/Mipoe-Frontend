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
  funds_distributed: number;  // NEW: Amount paid to creators
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

// --- NEW BRAND PROFILE ENDPOINTS ---

export interface BrandProfile {
  id: number;
  username: string;
  email: string;
  phone?: string;
  msg?: string;
}

export async function getBrandProfile(): Promise<BrandProfile> {
  try {
    const res = await fetch(`${API_BASE}/api/brand/profile`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      const errorData: ErrorResponse = data;
      throw new Error(errorData.msg || 'Failed to fetch brand profile');
    }
    return data as BrandProfile;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
}

export async function updateBrandProfile(profileData: { username?: string; phone?: string }): Promise<UpdateClipResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/brand/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data: UpdateClipResponse = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to update brand profile');
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

export async function allocateBudget(campaignId: number, amount: number): Promise<{
  msg: string;  
  allocated_amount: number; 
  new_wallet_balance: number; 
  new_funds_allocated: number;
  campaign_id: number; }> {
  const res = await fetch(`${API_BASE}/api/payments/allocate-budget`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ campaign_id: campaignId, amount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Allocation failed');
  return data;
}

export async function reclaimBudget(campaignId: number, amount: number): Promise<{ 
  msg: string;
  reclaimed_amount: number;
  new_wallet_balance: number;
  new_funds_allocated: number;
  campaign_id: number;
 }> {
  const res = await fetch(`${API_BASE}/api/payments/reclaim-budget`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ campaign_id: campaignId, amount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Reclaim failed');
  return data;
}

// --- NEW: CREATOR DISTRIBUTION & WITHDRAWAL ENDPOINTS ---

export interface DistributeFundsResponse {
  msg: string;
  campaign_id: number;
  creator_id: number;
  total_earnings: number;
  creator_share: number;
  platform_commission: number;
  view_count: number;
  new_creator_wallet: number;
  new_funds_distributed: number;
}

export async function distributeFundsToCreator(
  campaignId: number,
  creatorId: number,
  viewCount: number,
  cpv: number,
  viewThreshold: number
): Promise<DistributeFundsResponse> {
  const res = await fetch(`${API_BASE}/api/payments/distribute-to-creator`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      campaign_id: campaignId,
      creator_id: creatorId,
      view_count: viewCount,
      cpv: cpv,
      view_threshold: viewThreshold
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Distribution failed');
  return data;
}

export interface CreatorWithdrawResponse {
  msg: string;
  amount: number;
  new_balance: number;
  payout_method: string;
  reference_id: string;
  utr: string;
  status: string;
}

export async function creatorWithdraw(
  amount: number,
  payoutMethod: 'upi' | 'bank',
  upiId?: string,
  bankAccount?: string,
  ifsc?: string
): Promise<CreatorWithdrawResponse> {
  const payload: any = {
    amount,
    payout_method: payoutMethod
  };

  if (payoutMethod === 'upi') {
    payload.upi_id = upiId;
  } else if (payoutMethod === 'bank') {
    payload.bank_account = bankAccount;
    payload.ifsc = ifsc;
  }

  const res = await fetch(`${API_BASE}/api/payments/creator-withdraw`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Withdrawal failed');
  return data;
}

export interface Transaction {
  id: number;
  user_type: string;
  user_id: number;
  campaign_id?: number;
  amount: number;
  type: string;  // 'deposit', 'allocation', 'reclaim', 'earning', 'payout', 'commission'
  status: string;  // 'pending', 'success', 'failed'
  external_txn_id?: string;
  description: string;
  created_at: string;
  campaign?: {
    name: string;
  };
}

export interface TransactionsResponse {
  msg: string;
  user_type: string;
  user_id: number;
  count: number;
  transactions: Transaction[];
  limit: number;
  offset: number;
}

export async function getTransactions(
  userType: 'brand' | 'creator',
  userId: number,
  campaignId?: number,
  txnType?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  if (campaignId) params.append('campaign_id', campaignId.toString());
  if (txnType) params.append('txn_type', txnType);
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(
    `${API_BASE}/api/payments/transactions/${userType}/${userId}?${params.toString()}`,
    {
      headers: getAuthHeaders()
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch transactions');
  return data;
}

// --- NEW: PHASE 3 ENDPOINTS (Fund Locking with Inclusive Fees) ---

export interface RefundResponse {
  msg: string;
  campaign_id: number;
  refundable_amount: number;
  funds_allocated: number;
  funds_distributed: number;
  new_wallet_balance: number;
}

export async function refundCampaign(campaignId: number): Promise<RefundResponse> {
  const res = await fetch(`${API_BASE}/api/payments/refund-campaign`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ campaign_id: campaignId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Refund failed');
  return data;
}

export interface CampaignFinancialSummary {
  funds_allocated: number;
  funds_distributed: number;
  refundable: number;
  platform_earnings: number;
  utilization_percentage: number;
}

export interface CampaignSummaryResponse {
  msg: string;
  campaign_id: number;
  budget: number;
  cpv: number;
  view_threshold: number;
  total_view_count: number;
  deadline: string;
  financial_summary: CampaignFinancialSummary;
  participation: {
    creator_count: number;
    total_clips: number;
  };
}

export async function getCampaignSummary(campaignId: number): Promise<CampaignSummaryResponse> {
  const res = await fetch(`${API_BASE}/api/payments/campaign-summary/${campaignId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch campaign summary');
  return data;
}

export interface PendingPayout {
  creator_id: number;
  creator_name: string;
  total_views: number;
  total_earnings: number;
  already_paid: number;
  pending_amount: number;
  creator_share: number;
  platform_commission: number;
}

export interface PendingPayoutsResponse {
  msg: string;
  campaign_id: number;
  campaign_metrics: {
    cpv: number;
    view_threshold: number;
    total_campaign_views: number;
  };
  pending_count: number;
  total_pending_amount: number;
  pending_payouts: PendingPayout[];
}

export async function getPendingPayouts(campaignId: number): Promise<PendingPayoutsResponse> {
  const res = await fetch(`${API_BASE}/api/brand/campaigns/${campaignId}/pending-payouts`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch pending payouts');
  return data;
}

// --- PHASE 4: PERFORMANCE LOOP ---

export interface CreatorEarnings {
  total_earned: number;
  creator_share: number;
  platform_commission: number;
  total_already_paid: number;
  pending_amount: number;
  pending_creator_share: number;
}

export interface EarningsCalculationResponse {
  msg: string;
  campaign_id: number;
  creator_id: number;
  campaign_metrics: {
    cpv: number;
    view_threshold: number;
    brand_id: number;
  };
  performance: {
    total_clips: number;
    total_views: number;
    milestones_reached: number;
  };
  earnings: CreatorEarnings;
  clips?: any[];
}

export async function calculateEarnings(
  campaignId: number,
  creatorId: number,
  includeClips: boolean = false
): Promise<EarningsCalculationResponse> {
  const params = new URLSearchParams();
  if (includeClips) params.append('include_clips', 'true');

  const res = await fetch(
    `${API_BASE}/api/payments/calculate-earnings/${campaignId}/${creatorId}?${params.toString()}`,
    {
      headers: getAuthHeaders()
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to calculate earnings');
  return data;
}

export interface BulkDistributionResult {
  campaign_id: number;
  creator_id: number;
  status: 'success' | 'failed';
  reason?: string;
  total_earnings?: number;
  creator_share?: number;
  platform_commission?: number;
  new_creator_wallet?: number;
}

export interface BulkDistributeResponse {
  msg: string;
  summary: {
    total_requested: number;
    successful: number;
    failed: number;
    total_distributed: number;
  };
  results: BulkDistributionResult[];
}

export async function bulkDistribute(distributions: Array<{
  campaign_id: number;
  creator_id: number;
  view_count: number;
  cpv: number;
  view_threshold: number;
}>): Promise<BulkDistributeResponse> {
  const res = await fetch(`${API_BASE}/api/payments/bulk-distribute`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ distributions })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Bulk distribution failed');
  return data;
}

// --- PHASE 4: VIEW COUNT TRACKING & PERFORMANCE LOOP ---

export interface UpdateViewCountResponse {
  msg: string;
  clip_id: number;
  campaign_id: number;
  old_view_count: number;
  new_view_count: number;
  view_count_diff: number;
}

export async function updateClipViewCount(clipId: number, viewCount: number): Promise<UpdateViewCountResponse> {
  const res = await fetch(`${API_BASE}/api/admin/clip/${clipId}/view-count`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ view_count: viewCount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update view count');
  return data;
}

export interface UpdateCampaignViewsResponse {
  msg: string;
  campaign_id: number;
  old_total_views: number;
  new_total_views: number;
  view_diff: number;
  clip_count: number;
}

export async function updateCampaignViewCount(campaignId: number, totalViewCount?: number): Promise<UpdateCampaignViewsResponse> {
  const body: any = {};
  if (totalViewCount !== undefined) {
    body.total_view_count = totalViewCount;
  }

  const res = await fetch(`${API_BASE}/api/admin/campaign/${campaignId}/update-views`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to update campaign views');
  return data;
}

export interface CreatorPerformanceMetric {
  creator_id: number;
  creator_name: string;
  total_views: number;
  clips: number;
  total_earned: number;
  total_paid: number;
  pending: number;
}

export interface CampaignPerformanceAnalytics {
  msg: string;
  campaign_id: number;
  overview: {
    total_clips: number;
    total_creators: number;
    total_views: number;
    milestones_reached: number;
    cpv: number;
    view_threshold: number;
  };
  financial: {
    funds_allocated: number;
    funds_distributed: number;
    total_earned: number;
    total_pending: number;
    utilization_percentage: number;
    remaining_budget: number;
  };
  creator_performance: CreatorPerformanceMetric[];
}

export async function getCampaignPerformanceAnalytics(campaignId: number): Promise<CampaignPerformanceAnalytics> {
  const res = await fetch(`${API_BASE}/api/admin/analytics/campaign-performance/${campaignId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch analytics');
  return data;
}

// --- PHASE 5: PAYOUT DETAILS MANAGEMENT ---

export interface PayoutDetailsUPI {
  msg: string;
  payout_method: 'upi';
  upi_id: string;
}

export interface PayoutDetailsBank {
  msg: string;
  payout_method: 'bank';
  bank_account: string;
  ifsc: string;
  account_holder_name: string;
}

export type SavePayoutDetailsResponse = PayoutDetailsUPI | PayoutDetailsBank;

export async function savePayoutDetails(
  payoutMethod: 'upi' | 'bank',
  details: {
    upi_id?: string;
    bank_account?: string;
    ifsc?: string;
    account_holder_name?: string;
  }
): Promise<SavePayoutDetailsResponse> {
  const res = await fetch(`${API_BASE}/api/payments/creator/payout-details`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      payout_method: payoutMethod,
      ...details
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to save payout details');
  return data;
}

export async function getPayoutDetails(): Promise<SavePayoutDetailsResponse | { msg: string; payout_method: null }> {
  const res = await fetch(`${API_BASE}/api/payments/creator/payout-details`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch payout details');
  return data;
}

export interface VerifyPayoutDetailsResponse {
  msg: string;
  verified: boolean;
  payout_method?: 'upi' | 'bank';
  missing?: string[];
}

export async function verifyPayoutDetails(): Promise<VerifyPayoutDetailsResponse> {
  const res = await fetch(`${API_BASE}/api/payments/creator/verify-payout-details`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Payout details verification failed');
  return data;
}

export interface WithdrawalRecord {
  id: number;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  payout_method: 'upi' | 'bank';
  reference_id?: string;
  utr?: string;
  created_at: string;
}

export interface WithdrawalHistoryResponse {
  msg: string;
  withdrawals: WithdrawalRecord[];
  count: number;
  limit: number;
  offset: number;
}

export async function getWithdrawalHistory(
  status?: 'pending' | 'success' | 'failed',
  limit = 20,
  offset = 0
): Promise<WithdrawalHistoryResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`${API_BASE}/api/payments/creator/withdrawals?${params}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch withdrawal history');
  return data;
}

// --- PHASE 6: COMPREHENSIVE REFUND FLOW ---

export interface RefundRequest {
  refund_id: number;
  campaign_id: number;
  type: 'mid_campaign' | 'partial_return' | 'campaign_deletion' | 'dispute_resolution';
  requested_amount: number;
  approved_amount: number | null;
  refundable_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  reason: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface RefundRequestsResponse {
  msg: string;
  refund_requests: RefundRequest[];
  count: number;
  limit: number;
  offset: number;
}

export async function requestRefund(
  campaignId: number,
  requestedAmount: number,
  reason: string
): Promise<{
  msg: string;
  refund_id: number;
  campaign_id: number;
  requested_amount: number;
  refundable_amount: number;
  status: string;
  created_at: string;
}> {
  const res = await fetch(`${API_BASE}/api/payments/request-refund`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      campaign_id: campaignId,
      requested_amount: requestedAmount,
      reason
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to request refund');
  return data;
}

export async function getRefundRequests(
  status?: 'pending' | 'approved' | 'rejected' | 'completed',
  campaignId?: number,
  limit = 20,
  offset = 0
): Promise<RefundRequestsResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (campaignId) params.append('campaign_id', campaignId.toString());
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`${API_BASE}/api/payments/refund-requests?${params}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch refund requests');
  return data;
}

export interface RefundStatusResponse {
  msg: string;
  refund_id: number;
  campaign_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  type: string;
  requested_amount: number;
  refundable_amount: number;
  approved_amount: number | null;
  reason: string;
  rejection_reason: string | null;
  timeline: {
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  };
  transaction?: {
    id: number;
    amount: number;
    status: string;
    created_at: string;
  };
}

export async function getRefundStatus(refundId: number): Promise<RefundStatusResponse> {
  const res = await fetch(`${API_BASE}/api/payments/refund-status/${refundId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch refund status');
  return data;
}

export interface ApproveRefundResponse {
  msg: string;
  refund_id: number;
  campaign_id: number;
  approved_amount: number;
  brand_wallet_updated: number;
  status: string;
  processed_at: string;
}

export async function approveRefund(
  refundId: number,
  approvedAmount?: number,
  approvalReason?: string
): Promise<ApproveRefundResponse> {
  const res = await fetch(`${API_BASE}/api/payments/admin/approve-refund`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      refund_id: refundId,
      approved_amount: approvedAmount,
      approval_reason: approvalReason
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to approve refund');
  return data;
}

export async function rejectRefund(
  refundId: number,
  rejectionReason: string
): Promise<{
  msg: string;
  refund_id: number;
  status: string;
  rejection_reason: string;
}> {
  const res = await fetch(`${API_BASE}/api/payments/admin/reject-refund`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      refund_id: refundId,
      rejection_reason: rejectionReason
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to reject refund');
  return data;
}

export interface AuditTrailRecord {
  refund_id: number;
  brand_id: number;
  campaign_id: number;
  type: string;
  requested_amount: number;
  approved_amount: number | null;
  status: string;
  reason: string;
  created_at: string;
  completed_at: string | null;
}

export interface RefundAuditTrailResponse {
  msg: string;
  audit_trail: AuditTrailRecord[];
  count: number;
  summary: {
    total_refunded: number;
    pending_approval: number;
    limit: number;
    offset: number;
  };
}

export async function getRefundAuditTrail(
  brandId?: number,
  campaignId?: number,
  status?: string,
  limit = 50,
  offset = 0
): Promise<RefundAuditTrailResponse> {
  const params = new URLSearchParams();
  if (brandId) params.append('brand_id', brandId.toString());
  if (campaignId) params.append('campaign_id', campaignId.toString());
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`${API_BASE}/api/payments/admin/refund-audit-trail?${params}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch refund audit trail');
  return data;
}